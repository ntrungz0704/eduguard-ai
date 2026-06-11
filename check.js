const { prisma } = require('./server/src/infrastructure/database/prisma');
async function check() {
  const s = await prisma.score.findFirst({ where: { mssv: 'PS47261', courseId: 'VIE104' } });
  console.log(s);
}
check().finally(() => prisma.$disconnect());
