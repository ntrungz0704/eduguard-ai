const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
async function main() {
  await prisma.score.upsert({
    where: {
      mssv_courseId_semester: { mssv: 'PS47261', courseId: 'VIE103', semester: 'SP26' }
    },
    update: { value: 8.2, status: 'PASSED' },
    create: { mssv: 'PS47261', courseId: 'VIE103', semester: 'SP26', value: 8.2, status: 'PASSED' }
  });
  console.log("Added VIE103 to PS47261");
  await prisma.$disconnect();
}
main();
