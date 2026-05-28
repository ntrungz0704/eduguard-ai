const { prisma } = require('./src/infrastructure/database/prisma');
async function main() {
  await prisma.intervention.deleteMany({ where: { mssv: { startsWith: 'DEMO' } } });
  await prisma.message.deleteMany({ where: { OR: [{ senderId: { startsWith: 'DEMO' } }, { receiverId: { startsWith: 'DEMO' } }] } });
  console.log('Cleaned DEMO records');
}
main().catch(console.error).finally(() => prisma.$disconnect());
