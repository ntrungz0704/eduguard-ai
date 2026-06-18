const { prisma } = require('./src/infrastructure/database/prisma');
async function check() {
  const sessions = await prisma.importSession.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log(sessions);
}
check().finally(() => prisma.$disconnect());
