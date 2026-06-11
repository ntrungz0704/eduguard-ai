const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
prisma.student.findUnique({ where: { mssv: 'PS47261' }, include: { scores: { include: { course: true } } } })
  .then(s => console.log(JSON.stringify(s, null, 2)))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
