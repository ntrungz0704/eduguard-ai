const { PrismaClient } = require('./server/generated/prisma');
const prisma = new PrismaClient();

async function checkDb() {
  const studentCount = await prisma.student.count();
  const userCount = await prisma.user.count();
  const advisorCount = await prisma.user.count({ where: { role: 'ADVISOR' } });
  const scoreCount = await prisma.score.count();
  const interventionCount = await prisma.intervention.count();
  const messageCount = await prisma.message.count();
  
  console.log(`DB Stats:
  - Students: ${studentCount}
  - Users (Total): ${userCount}
  - Advisors: ${advisorCount}
  - Scores: ${scoreCount}
  - Interventions: ${interventionCount}
  - Messages: ${messageCount}
  `);
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
