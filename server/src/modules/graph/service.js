const { getNeo4jDriver } = require('../../config/neo4j');

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
}

module.exports = new GraphService();
