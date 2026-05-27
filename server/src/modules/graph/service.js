const { getNeo4jDriver } = require('../../config/neo4j');
const fs = require('fs');
const path = require('path');

class GraphService {
  async getDependencies() {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      // Get all courses and their prerequisite relationships
      const result = await session.run(`
        MATCH (c:Course)
        OPTIONAL MATCH (p:Course)-[:PREREQUISITE_FOR]->(c)
        RETURN c, collect(p) as prerequisites
      `);
      
      const nodes = [];
      const edges = [];
      
      result.records.forEach(record => {
        const course = record.get('c').properties;
        nodes.push({
          id: course.code,
          label: course.name,
          title: `${course.code}: ${course.name} (Credits: ${course.credits})`,
          group: 'course',
          difficulty: course.difficulty,
          workload: course.workload
        });
        
        const prereqs = record.get('prerequisites');
        prereqs.forEach(prereq => {
          if (prereq && prereq.properties) {
            edges.push({
              from: prereq.properties.code,
              to: course.code,
              label: 'PREREQUISITE_FOR'
            });
          }
        });
      });
      
      return { nodes, edges };
    } finally {
      await session.close();
    }
  }

  async getRiskAnalysis() {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      // Find bottleneck courses (courses that are prerequisites for many others)
      const result = await session.run(`
        MATCH (p:Course)-[:PREREQUISITE_FOR]->(c:Course)
        WITH p, count(c) as dependentCount
        WHERE dependentCount > 1
        RETURN p, dependentCount
        ORDER BY dependentCount DESC
      `);
      
      const bottlenecks = result.records.map(r => ({
        courseCode: r.get('p').properties.code,
        courseName: r.get('p').properties.name,
        dependentCount: r.get('dependentCount').toInt()
      }));
      
      return { bottlenecks };
    } finally {
      await session.close();
    }
  }

  async getStudentRiskChain(mssv) {
    const dataPath = path.join(__dirname, '../../datasets/training_data.json');
    const curriculumPath = path.join(__dirname, '../../../../../data/curriculum.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error('Training data not found');
    }
    const trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const student = trainingData.students.find(s => s.id === mssv);
    if (!student) {
      throw new Error('Student not found');
    }

    let curriculumData = null;
    if (fs.existsSync(curriculumPath)) {
      curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
    }

    // Helper to find semester
    const getSemester = (courseName) => {
      if (!curriculumData) return 0;
      for (const sem of curriculumData.semesters) {
        if (sem.courses.some(c => c.name === courseName)) {
           return sem.semester;
        }
      }
      return 0; // default if not found
    };

    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      // Find all explicitly chained courses from Neo4j
      const result = await session.run(`
        MATCH p = (c1:Course)-[:PREREQUISITE_FOR]->(c2:Course)
        RETURN c1.code AS prereqCode, c1.name AS prereqName, c2.code AS dependentCode, c2.name AS dependentName
      `);

      const explicitChains = [];
      result.records.forEach(r => {
        explicitChains.push({
          prereqCode: r.get('prereqCode'),
          prereqName: r.get('prereqName'),
          dependentCode: r.get('dependentCode'),
          dependentName: r.get('dependentName')
        });
      });

      // Calculate risk per course based on student scores
      const riskNodes = [];
      const riskEdges = [];
      const processedNodes = new Set();
      const reasons = [];

      for (const chain of explicitChains) {
        // match student scores by scanning keys that include the subject name
        const prereqKey = Object.keys(student.scores).find(k => k.includes(chain.prereqName));
        const depKey = Object.keys(student.scores).find(k => k.includes(chain.dependentName));
        
        const pScore = prereqKey ? student.scores[prereqKey] : null;
        const dScore = depKey ? student.scores[depKey] : null;

        let pStatus = 'Normal';
        if (pScore === null) pStatus = 'Missing';
        else if (pScore < 5.0) pStatus = 'Failed';
        else if (pScore < 6.5) pStatus = 'Warning';

        let dStatus = 'Normal';
        if (dScore === null) dStatus = 'Missing';
        else if (dScore < 5.0) dStatus = 'Failed';
        else if (dScore < 6.5) dStatus = 'Warning';

        // Add nodes
        if (!processedNodes.has(chain.prereqCode)) {
          riskNodes.push({ 
            id: chain.prereqCode, 
            name: chain.prereqName, 
            score: pScore, 
            status: pStatus,
            semester: getSemester(chain.prereqName)
          });
          processedNodes.add(chain.prereqCode);
        }
        if (!processedNodes.has(chain.dependentCode)) {
          riskNodes.push({ 
            id: chain.dependentCode, 
            name: chain.dependentName, 
            score: dScore, 
            status: dStatus,
            semester: getSemester(chain.dependentName)
          });
          processedNodes.add(chain.dependentCode);
        }

        // Evaluate chain
        // If prereq is Failed or Missing, the dependent is at High Risk of failure (Predicted Risk)
        if (pStatus === 'Failed' || pStatus === 'Missing') {
          riskEdges.push({ from: chain.prereqCode, to: chain.dependentCode, type: 'critical' });
          if (!reasons.find(r => r.course === chain.dependentCode)) {
             reasons.push({
               course: chain.dependentCode,
               courseName: chain.dependentName,
               status: 'Predicted Risk',
               impact: pStatus === 'Failed' ? \`Failed prerequisite \${chain.prereqCode}\` : \`Missing prerequisite \${chain.prereqCode}\`,
               explanation: \`Weak foundation in \${chain.prereqName} severely limits success in \${chain.dependentName}.\`
             });
          }
          // Override target node status for visualization if it hasn't failed yet
          const targetNode = riskNodes.find(n => n.id === chain.dependentCode);
          if (targetNode && targetNode.status !== 'Failed') {
            targetNode.status = 'At Risk';
          }
        } else if (pStatus === 'Warning') {
          riskEdges.push({ from: chain.prereqCode, to: chain.dependentCode, type: 'warning' });
          if (!reasons.find(r => r.course === chain.dependentCode)) {
             reasons.push({
               course: chain.dependentCode,
               courseName: chain.dependentName,
               status: 'Warning',
               impact: \`Low grade in \${chain.prereqCode}\`,
               explanation: \`Marginal performance in \${chain.prereqName} (\${pScore}) may cause struggles in \${chain.dependentName}.\`
             });
          }
          const targetNode = riskNodes.find(n => n.id === chain.dependentCode);
          if (targetNode && targetNode.status !== 'Failed') {
             targetNode.status = 'Warning';
          }
        } else {
          riskEdges.push({ from: chain.prereqCode, to: chain.dependentCode, type: 'normal' });
        }
      }

      // Filter nodes down to ONLY those connected via Critical or Warning edges to focus the narrative
      const relevantNodeIds = new Set();
      riskEdges.filter(e => e.type === 'critical' || e.type === 'warning').forEach(e => {
        relevantNodeIds.add(e.from);
        relevantNodeIds.add(e.to);
      });

      // Ensure that if a chain has multiple steps (A -> B -> C), we grab the whole chain
      let expanded = true;
      while(expanded) {
        expanded = false;
        riskEdges.forEach(e => {
          if (relevantNodeIds.has(e.from) && !relevantNodeIds.has(e.to)) {
             relevantNodeIds.add(e.to); expanded = true;
          }
          if (relevantNodeIds.has(e.to) && !relevantNodeIds.has(e.from)) {
             relevantNodeIds.add(e.from); expanded = true;
          }
        });
      }

      const finalNodes = riskNodes.filter(n => relevantNodeIds.has(n.id));
      const finalEdges = riskEdges.filter(e => relevantNodeIds.has(e.from) && relevantNodeIds.has(e.to));

      return {
        student: { mssv, attendance: student.attendance, gpa: student.gpa }, // Note: we can add GPA calculate if needed
        nodes: finalNodes,
        edges: finalEdges,
        explanations: reasons
      };

    } finally {
      await session.close();
    }
  }
}

module.exports = new GraphService();
