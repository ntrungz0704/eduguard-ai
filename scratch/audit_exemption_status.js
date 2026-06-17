const { PrismaClient } = require('../server/generated/prisma');
const prisma = new PrismaClient();

async function audit() {
  // Find scores where value is 1.0 but status is not PASSED
  const incorrectScores = await prisma.score.findMany({
    where: {
      value: 1.0,
      status: { not: 'PASSED' }
    }
  });

  console.log(`Auditing Database: Found ${incorrectScores.length} records with value = 1.0 and status != 'PASSED'.`);

  if (incorrectScores.length > 0) {
    console.log('Correcting records to PASSED...');
    const result = await prisma.score.updateMany({
      where: {
        value: 1.0,
        status: { not: 'PASSED' }
      },
      data: {
        status: 'PASSED'
      }
    });
    console.log(`Successfully updated ${result.count} records to PASSED.`);
  } else {
    console.log('All exemption records in the database are already correct.');
  }

  // Also check if any score is less than 5.0 but is marked as PASSED when it is not 1.0
  const wrongPassed = await prisma.score.findMany({
    where: {
      value: {
        lt: 5.0,
        not: 1.0
      },
      status: 'PASSED'
    }
  });
  console.log(`Auditing Database: Found ${wrongPassed.length} records with score < 5.0 (excluding 1.0) marked as PASSED.`);
  if (wrongPassed.length > 0) {
    wrongPassed.forEach(s => {
      console.log(`- Student: ${s.mssv}, Course: ${s.courseId}, Score: ${s.value}, Status: ${s.status}`);
    });
  }
}

audit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
