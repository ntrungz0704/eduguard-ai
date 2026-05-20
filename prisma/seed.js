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
  
  function getCourseCredits(courseNameOrId) {
    const name = String(courseNameOrId || '').trim();
    const lower = name.toLowerCase();
    const code = name.toUpperCase();

    if (lower.includes('thể chất') || lower.includes('vovinam') || code.includes('VIE103')) return 2;
    if (lower.includes('quốc phòng') || lower.includes('gdqp') || code.includes('VIE104')) return 4;
    if (lower.includes('thực tập tốt nghiệp') || code.includes('PRO115') || code.includes('PRO110')) return 5;

    if (
      lower.includes('chính trị') || 
      code.includes('VIE108') || 
      lower.includes('dự án tốt nghiệp') || 
      code.includes('PRO2201') ||
      code.includes('PRO220')
    ) {
      return 5;
    }

    if (
      lower.includes('tiếng anh 1.1') || code.includes('ENT112') || code.includes('ENT111') ||
      lower.includes('tiếng anh 1.2') || code.includes('ENT123') ||
      lower.includes('tiếng anh 2.1') || code.includes('ENT213') ||
      lower.includes('tiếng anh 2.2') || code.includes('ENT223') ||
      lower.includes('kỹ năng học tập') || code.includes('PDP102') ||
      lower.includes('kỹ năng phát triển bản thân') || code.includes('PDP103') ||
      lower.includes('kỹ năng làm việc') || code.includes('PDP104') ||
      lower.includes('pháp luật') || code.includes('VIE1028') || code.includes('VIE102')
    ) {
      return 2;
    }

    return 3;
  }

  const coursePromises = Array.from(courseIds).map((id) => {
    const credits = getCourseCredits(id);
    return prisma.course.upsert({
      where: { id },
      update: { credits },
      create: {
        id,
        name: id,
        credits,
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
