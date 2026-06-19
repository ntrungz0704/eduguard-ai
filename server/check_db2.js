const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.student.findUnique({ 
    where: { mssv: 'PS47261' }, 
    include: { scores: true }
  });
  console.log(JSON.stringify(s ? s.scores : [], null, 2));
  await prisma.$disconnect();
}
main();
