const path = require('path');
const { PrismaClient } = require('../../../generated/prisma');

// Dynamically resolve the absolute path to dev.db to ensure SQLite resolves consistently 
// regardless of the current working directory of the node process.
const dbPath = path.resolve(__dirname, '../../../../prisma/dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

module.exports = { prisma };
