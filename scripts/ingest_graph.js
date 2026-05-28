const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'eduguard_neo4j_password';

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

async function ingestGraph() {
  const session = driver.session();
  console.log('Connected to Neo4j...');

  try {
    // 1. Clear existing graph
    console.log('Clearing existing graph...');
    await session.run('MATCH (n) DETACH DELETE n');

    // 2. Read all JSON files
    const jsonDir = path.join(__dirname, '../data/processed-json');
    const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));

    console.log(`Found ${files.length} syllabi. Ingesting...`);

    // We'll first create all Course nodes to ensure they exist before linking prerequisites
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
      
      await session.run(
        `
        MERGE (c:Course {code: $code})
        SET c.name = $name,
            c.credits = $credits,
            c.difficulty = $difficulty,
            c.workload = $workload
        `,
        {
          code: data.course_code,
          name: data.course_name,
          credits: data.credits || 0,
          difficulty: data.metadata?.difficulty_score || 0,
          workload: data.metadata?.workload_score || 0
        }
      );
    }

    // 3. Apply explicit curriculum structure and dependencies
    const curriculum = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/curriculum.json'), 'utf8'));
    const dependencies = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/course_dependency.json'), 'utf8'));

    // Update Courses with Semester info and Branches
    for (const sem of curriculum.semesters) {
      for (const course of sem.courses) {
        await session.run(
          `
          MATCH (c:Course) WHERE c.code STARTS WITH $code
          SET c.semester = $semester,
              c.branch = $branch
          `,
          {
            code: course.code,
            semester: sem.semester,
            branch: course.branch || 'Core'
          }
        );
      }
    }

    // Link prerequisites explicitly using the dependency map
    for (const dep of dependencies) {
      const courseCode = dep.course_code;
      for (const prereqCode of dep.depends_on) {
        await session.run(
          `
          MATCH (c:Course) WHERE c.code STARTS WITH $code
          MATCH (p:Course) WHERE p.code STARTS WITH $prereqCode
          MERGE (p)-[:PREREQUISITE_FOR]->(c)
          `,
          { code: courseCode, prereqCode }
        );
      }
    }

    // Link CLOs
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
      const courseCode = data.course_code;

      if (data.learning_outcomes) {
        for (const clo of data.learning_outcomes) {
          await session.run(
            `
            MATCH (c:Course {code: $code})
            MERGE (clo:CLO {id: $cloId, course_code: $code})
            SET clo.title = $title, clo.details = $details
            MERGE (c)-[:HAS_CLO]->(clo)
            `,
            {
              code: courseCode,
              cloId: `${courseCode}_${clo.code}`,
              title: clo.title || '',
              details: clo.details || ''
            }
          );
        }
      }
    }

    console.log('Graph ingestion completed successfully.');
  } catch (error) {
    console.error('Error during ingestion:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

ingestGraph();
