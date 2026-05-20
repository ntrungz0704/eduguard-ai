const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const scores = await prisma.score.findMany({
    where: { mssv: 'PS47261' },
    include: { course: true }
  });

  console.log('--- ALL SCORES IN DB FOR PS47261 ---');
  scores.forEach((s, i) => {
    console.log(`${i+1}. CourseName: "${s.course?.name || s.courseId}", CourseId: "${s.courseId}", Value: ${s.value}, Status: "${s.status}", Semester: "${s.semester}"`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
