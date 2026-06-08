const path = require('path');
const { PrismaClient } = require('../../../generated/prisma');

const dbPath = path.resolve(__dirname, '../../../../prisma/dev.db');
const databaseUrl = process.env.DATABASE_URL || `file:${dbPath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

module.exports = { prisma };
