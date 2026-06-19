const path = require('path');
const { PrismaClient } = require('../../../generated/prisma');

const dbPath = path.resolve(__dirname, '../../../../prisma/dev.db');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl === 'file:./dev.db' || databaseUrl.includes('/app/prisma/dev.db')) {
  // Luôn dùng path tuyệt đối được resolve tại runtime để tránh lỗi đường dẫn trên Render
  databaseUrl = `file:${dbPath}`;
}

// Sửa lỗi cú pháp Prisma với đường dẫn tuyệt đối trên Linux (cần 3 dấu gạch chéo)
if (databaseUrl.startsWith('file:/') && !databaseUrl.startsWith('file:///')) {
  databaseUrl = databaseUrl.replace('file:/', 'file:///');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

module.exports = { prisma };
