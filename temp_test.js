const { prisma } = require('./server/src/infrastructure/database/prisma');
async function check() {
  const s = await prisma.score.findMany({ where: { mssv: 'PS47261' } });
  console.log(s.map(x => x.courseId));
}
check().finally(() => prisma.$disconnect());
