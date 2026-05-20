const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Students ---');
  const students = await prisma.student.findMany({
    take: 5
  });
  console.log(students);

  console.log('--- Scores for PS47261 ---');
  const scores = await prisma.score.findMany({
    where: { mssv: 'PS47261' },
    include: { course: true }
  });
  console.log(`Found ${scores.length} scores`);
  scores.forEach(s => {
    console.log(`${s.courseId} (${s.course?.name || ''}): ${s.value} [${s.status}]`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
