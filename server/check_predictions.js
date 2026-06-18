const { prisma } = require('./src/infrastructure/database/prisma');
async function check() {
  const sv = await prisma.prediction.findMany({ where: { mssv: 'PS47503' } });
  console.log(sv);
}
check().finally(() => prisma.$disconnect());
