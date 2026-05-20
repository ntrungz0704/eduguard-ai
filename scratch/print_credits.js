const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const scores = await prisma.score.findMany({
    where: { mssv: 'PS47261' },
    include: { course: true }
  });
  let total = 0;
  scores.forEach(s => {
    console.log(`${s.courseId} | ${s.course?.name} | DB Credits: ${s.course?.credits}`);
    total += s.course?.credits || 0;
  });
  console.log('Total credits of these 20 courses in DB:', total);
}

main().catch(console.error).finally(() => prisma.$disconnect());
