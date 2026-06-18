const { prisma } = require('./src/infrastructure/database/prisma');

async function check() {
  const scores = await prisma.score.findMany({ where: { mssv: 'PS47503' } });
  console.log('--- SCORES FOR PS47503 ---');
  console.log(scores.map(s => `${s.courseId}: ${s.value} (Status: ${s.status})`).join('\n'));
}

check().catch(console.error).finally(() => prisma.$disconnect());
