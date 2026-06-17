const { PrismaClient } = require('../server/generated/prisma');
const prisma = new PrismaClient();

async function inspect() {
  // 1. Inspect all courses in database
  const courses = await prisma.course.findMany({
    orderBy: { id: 'asc' }
  });
  console.log(`=== DB Courses (${courses.length}) ===`);
  courses.forEach(c => {
    console.log(`- ${c.id}: ${c.name} (${c.credits} credits)`);
  });

  // 2. Find scores with value = 1.0
  const exemptionScores = await prisma.score.findMany({
    where: { value: 1.0 },
    take: 10
  });
  console.log(`\n=== DB Scores with value = 1.0 (${exemptionScores.length} found) ===`);
  exemptionScores.forEach(s => {
    console.log(`- Student: ${s.mssv}, Course: ${s.courseId}, Value: ${s.value}, Status: ${s.status}, Semester: ${s.semester}`);
  });
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
