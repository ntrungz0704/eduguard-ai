const { prisma } = require('./src/infrastructure/database/prisma');

async function main() {
  const scores = await prisma.score.findMany({
    where: { mssv: 'PS47261' },
    select: { courseId: true, value: true, rawScore: true, semester: true, status: true, updatedAt: true }
  });
  console.log(JSON.stringify(scores, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
