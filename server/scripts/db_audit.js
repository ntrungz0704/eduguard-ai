const { prisma } = require('../src/infrastructure/database/prisma');

async function checkDB() {
  const students = await prisma.student.count();
  const courses = await prisma.course.count();
  const scores = await prisma.score.count();
  
  const orphanScores = await prisma.score.count({
    where: {
      OR: [
        { student: null },
        { course: null }
      ]
    }
  });

  const nullScores = await prisma.score.count({
    where: {
      value: null
    }
  });

  console.log(JSON.stringify({ students, courses, scores, orphanScores, nullScores }));
}

checkDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
