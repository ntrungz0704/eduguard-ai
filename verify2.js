const { prisma } = require('./server/src/infrastructure/database/prisma');

async function check() {
  const s = await prisma.score.findMany({ where: { mssv: 'PS47261' }, include: { course: true } });
  console.log(`Count: ${s.length}`);
  const sumCredits = s.reduce((sum, x) => sum + x.course.credits, 0);
  console.log(`Total credits: ${sumCredits}`);
  s.forEach(x => console.log(`${x.course.name} (${x.course.id}) (${x.course.credits} cr): ${x.value}`));
}

check().catch(console.error).finally(() => prisma.$disconnect());
