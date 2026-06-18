const { prisma } = require('./src/infrastructure/database/prisma');
async function clean() {
  await prisma.score.deleteMany({ where: { mssv: 'TEST_SV_001' } });
  await prisma.student.deleteMany({ where: { mssv: 'TEST_SV_001' } });
  console.log('Cleaned DB');
}
clean().finally(() => prisma.$disconnect());
