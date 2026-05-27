const neo4j = require('neo4j-driver');

let driver;

function getNeo4jDriver() {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'eduguard_neo4j_password';
    
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

async function closeNeo4jDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = {
  getNeo4jDriver,
  closeNeo4jDriver
};
