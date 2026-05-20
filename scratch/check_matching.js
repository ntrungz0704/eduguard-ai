const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const fs = require('fs');
const path = require('path');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const trainingData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'training_data.json'), 'utf8'));
  const curriculumOrder = trainingData.curriculumOrder || [];

  const scores = await prisma.score.findMany({
    where: { mssv: 'PS47261' },
    include: { course: true }
  });

  console.log('--- CURRICULUM ORDER ---');
  console.log(curriculumOrder);

  console.log('\n--- SCORES IN DB ---');
  scores.forEach(s => {
    const exactMatch = curriculumOrder.includes(s.courseId);
    const softMatch = curriculumOrder.some(c => c.toLowerCase().includes(s.courseId.toLowerCase()) || s.courseId.toLowerCase().includes(c.toLowerCase()));
    console.log(`CourseId: "${s.courseId}", Exact Match: ${exactMatch}, Soft Match: ${softMatch}`);
  });

  const predictions = await prisma.prediction.findMany({
    where: { mssv: 'PS47261' },
    include: { course: true }
  });

  console.log('\n--- PREDICTIONS IN DB ---');
  predictions.forEach(p => {
    const exactMatch = curriculumOrder.includes(p.courseId);
    const softMatch = curriculumOrder.some(c => c.toLowerCase().includes(p.courseId.toLowerCase()) || p.courseId.toLowerCase().includes(c.toLowerCase()));
    console.log(`CourseId: "${p.courseId}", Exact Match: ${exactMatch}, Soft Match: ${softMatch}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
