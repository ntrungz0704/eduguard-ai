const { prisma } = require('./server/src/infrastructure/database/prisma');
async function check() {
  const c = await prisma.course.findFirst({ where: { name: { contains: 'Chính trị' } } });
  console.log('Chính trị Course:', c);
  const s = await prisma.score.findMany({ where: { mssv: 'PS47261' } });
  console.log('Scores for PS47261:', s.length);
  const names = await Promise.all(s.map(async score => {
     const course = await prisma.course.findUnique({ where: { id: score.courseId } });
     return `${course.name} (${course.credits} cr): ${score.value}`;
  }));
  console.log(names);
}
check().finally(() => prisma.$disconnect());
