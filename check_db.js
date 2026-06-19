const { prisma } = require('./server/src/infrastructure/database/prisma');

async function checkStudent() {
  const count = await prisma.student.count();
  console.log("Total students: " + count);
  const ps21034 = await prisma.student.findUnique({
    where: { mssv: 'PS21034' },
    include: { scores: true }
  });
  console.log("PS21034 exists?", !!ps21034);
}

checkStudent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
