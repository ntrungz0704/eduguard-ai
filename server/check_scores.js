const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.student.findUnique({ 
    where: { mssv: 'PS47261' }, 
    include: { scores: { include: { course: true } } }
  });
  console.log(JSON.stringify(s ? s.scores : [], null, 2));
  await prisma.$disconnect();
}
main();
