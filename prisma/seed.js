const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize the Prisma 7 client with the SQLite Driver Adapter
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding historical training data...');
  
  // Read training_data.json
  const dataPath = path.join(__dirname, '..', 'server', 'data', 'training_data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Training data file not found at:', dataPath);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const subjects = data.curriculumOrder || [];
  const students = data.students || [];
  
  console.log(`📊 Found ${subjects.length} curriculum subjects and ${students.length} students in JSON.`);
  
  // 1. Clean existing records first
  console.log('🧹 Cleaning up database tables...');
  await prisma.score.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.course.deleteMany({});
  console.log('✅ Database cleaned.');
  
  // 2. Extract and Seed all unique Courses
  console.log('📚 Scanning and Seeding Courses dynamically...');
  const courseIds = new Set(subjects);
  for (const s of students) {
    if (s.scores) {
      for (const subName of Object.keys(s.scores)) {
        courseIds.add(subName);
      }
    }
  }
  
  const coursePromises = Array.from(courseIds).map((id) => {
    return prisma.course.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: id,
        credits: 3, // Default FPT credits
        prerequisites: '',
      },
    });
  });
  await Promise.all(coursePromises);
  console.log(`✅ ${courseIds.size} unique courses seeded successfully.`);
  
  // 3. Bulk Seed Students
  console.log('👥 Batching student profiles...');
  const studentData = students.map((s) => ({
    mssv: s.id,
    name: s.name || `Sinh viên ${s.id}`,
    classCode: 'WD18301',
  }));
  
  console.log(`🚀 Inserting ${studentData.length} students in a single transaction...`);
  await prisma.student.createMany({
    data: studentData,
  });
  console.log('✅ Student profiles seeded.');
  
  // 4. Bulk Seed Scores
  console.log('✍️ Batching student score history...');
  const scoreCreates = [];
  for (const s of students) {
    const mssv = s.id;
    for (const [subName, scoreVal] of Object.entries(s.scores || {})) {
      if (scoreVal === null) continue;
      
      const status = scoreVal >= 5 ? 'PASSED' : 'FAILED';
      scoreCreates.push({
        mssv,
        courseId: subName,
        value: scoreVal,
        semester: 'Summer 2025',
        status,
      });
    }
  }
  
  console.log(`🚀 Inserting ${scoreCreates.length} score records in a single transaction...`);
  await prisma.score.createMany({
    data: scoreCreates,
  });
  console.log('✅ Grade history seeded.');
  
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
