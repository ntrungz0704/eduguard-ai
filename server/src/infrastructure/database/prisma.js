const { PrismaClient } = require('../../../generated/prisma');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', '..', '..', 'prisma', 'dev.db');
const url = process.env.DATABASE_URL || `file:${dbPath}`;
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
