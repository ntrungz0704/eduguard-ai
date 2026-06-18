const { prisma } = require('./src/infrastructure/database/prisma');

async function check() {
  const scores = await prisma.score.findMany({ where: { mssv: 'PS47503', courseId: { in: ['COM1071', 'WEB1013'] } } });
  console.log(scores);
}
check().finally(() => prisma.$disconnect());
