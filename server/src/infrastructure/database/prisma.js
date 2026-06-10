const path = require('path');
const { PrismaClient } = require('../../../generated/prisma');

const dbPath = path.resolve(__dirname, '../../../../prisma/dev.db');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl === 'file:./dev.db') {
  databaseUrl = `file:${dbPath}`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

module.exports = { prisma };
