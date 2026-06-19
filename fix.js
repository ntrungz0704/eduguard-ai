const { prisma } = require('./server/src/infrastructure/database/prisma');
const { isConditionalCourse } = require('./server/src/utils/dataService.js');

async function fix() {
  const scores = await prisma.score.findMany({
    where: { value: 1.0, status: 'FAILED' }
  });
  let count = 0;
  for (const s of scores) {
    if (isConditionalCourse('', s.courseId)) {
      await prisma.score.update({
        where: { id: s.id },
        data: { status: 'PASSED' }
      });
      count++;
    }
  }
  
  // also fix STUDYING ones just in case
  const studyingScores = await prisma.score.findMany({
    where: { value: 1.0, status: 'STUDYING' }
  });
  for (const s of studyingScores) {
    if (isConditionalCourse('', s.courseId)) {
      await prisma.score.update({
        where: { id: s.id },
        data: { status: 'PASSED' }
      });
      count++;
    }
  }

  console.log('Fixed ' + count + ' corrupted conditional scores.');
}
fix().catch(console.error).finally(() => prisma.$disconnect());
