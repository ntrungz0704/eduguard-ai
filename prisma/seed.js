const fs = require('fs');
const path = require('path');

// Dynamically resolve the absolute path to dev.db to ensure SQLite resolves consistently 
const dbPath = path.resolve(__dirname, 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const { PrismaClient } = require('../server/generated/prisma');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function main() {
  console.log('🌱 Start seeding historical training data...');
  
  // Read training_data.json
  const dataPath = path.join(__dirname, '..', 'server', 'src', 'datasets', 'training_data.json');
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
  await prisma.learningTask.deleteMany({});
  await prisma.learningBoard.deleteMany({});
  await prisma.prediction.deleteMany({});
  await prisma.intervention.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Database cleaned.');

  // 1.5. Seed Demo Users (SQLite doesn't support createMany, use transaction with create)
  console.log('👤 Seeding Demo Users...');
  await prisma.$transaction([
    prisma.user.create({ data: { email: 'admin@eduguard.ai', name: 'Admin EduGuard', role: 'ADMIN' } }),
    prisma.user.create({ data: { email: 'advisor@eduguard.ai', name: 'Advisor Demo', role: 'ADVISOR' } })
  ]);
  console.log('✅ Demo users seeded.');
  
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

  // Use upsert for courses sequentially (works on SQLite, avoids Prisma Rust Engine panic)
  for (const id of courseIds) {
    const credits = getCourseCredits(id);
    await prisma.course.upsert({
      where: { id },
      update: { credits },
      create: {
        id,
        name: id,
        credits,
        prerequisites: '',
      },
    });
  }
  console.log(`✅ ${courseIds.size} unique courses seeded successfully.`);
  
  // 3. Batch Seed Students using $transaction (SQLite compatible)
  console.log('👥 Batching student profiles...');
  const studentData = students.map((s) => ({
    mssv: s.id,
    name: s.name || `Sinh viên ${s.id}`,
    classCode: 'WD18301',
  }));
  
  console.log(`🚀 Inserting ${studentData.length} students...`);
  // Batch in chunks of 100 to avoid SQLite limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < studentData.length; i += BATCH_SIZE) {
    const batch = studentData.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map(s => prisma.student.create({ data: s }))
    );
  }
  console.log('✅ Student profiles seeded.');
  
  // 4. Batch Seed Scores
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
  
  console.log(`🚀 Inserting ${scoreCreates.length} score records...`);
  for (let i = 0; i < scoreCreates.length; i += BATCH_SIZE) {
    const batch = scoreCreates.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map(s => prisma.score.create({ data: s }))
    );
  }
  console.log('✅ Grade history seeded.');

  // 5. Insert Special Demo Cases (For Demo / UI)
  console.log('🎭 Inserting Special Demo Cases...');
  const demoStudents = [
    {
      mssv: 'PS21034',
      name: 'Nguyễn Hoàng Nam (Burnout)',
      classCode: 'WD18301',
      scores: {
        'Nhập môn lập trình': { value: 9.0, status: 'PASSED', attendance: 0.95 },
        'Xây dựng trang Web': { value: 8.5, status: 'PASSED', attendance: 0.90 },
        'Cơ sở dữ liệu': { value: 3.5, status: 'FAILED', attendance: 0.40 },
        'Lập trình PHP cơ bản': { value: 4.0, status: 'FAILED', attendance: 0.45 }
      }
    },
    {
      mssv: 'PS21502',
      name: 'Trần Minh Thư (Cần Cù Bù Thông Minh)',
      classCode: 'WD18301',
      scores: {
        'Nhập môn lập trình': { value: 5.5, status: 'PASSED', attendance: 1.0 },
        'Xây dựng trang Web': { value: 5.0, status: 'PASSED', attendance: 1.0 },
        'Cơ sở dữ liệu': { value: 4.5, status: 'FAILED', attendance: 1.0 },
        'Lập trình PHP cơ bản': { value: null, status: 'STUDYING', attendance: 1.0 }
      }
    },
    {
      mssv: 'PS20788',
      name: 'Lê Tuấn Kiệt (Hổng Kiến Thức Nền)',
      classCode: 'WD18301',
      scores: {
        'Nhập môn lập trình': { value: 2.0, status: 'FAILED', attendance: 0.8 },
        'Xây dựng trang Web': { value: 6.0, status: 'PASSED', attendance: 0.9 },
        'Cơ sở dữ liệu': { value: null, status: 'STUDYING', attendance: 0.85 }
      }
    }
  ];

  await prisma.$transaction(
    demoStudents.map(s => prisma.student.create({ data: { mssv: s.mssv, name: s.name, classCode: s.classCode } }))
  );

  const demoScores = [];
  for (const s of demoStudents) {
    for (const [courseId, scoreData] of Object.entries(s.scores)) {
      demoScores.push({
        mssv: s.mssv,
        courseId,
        value: scoreData.value,
        status: scoreData.status,
        attendance: scoreData.attendance,
        semester: 'Fall 2025'
      });
    }
  }
  await prisma.$transaction(
    demoScores.map(s => prisma.score.create({ data: s }))
  );
  
  // 6. Generate Predictions for Demo Cases
  console.log('🔮 Generating AI Predictions for Demo Cases...');
  const demoPredictions = [
    {
      mssv: 'PS21034',
      courseId: 'Lập trình cơ sở với JavaScript',
      predictedScore: 4.2,
      risk: 'HIGH',
      confidence: 0.88,
      explanation: 'Sinh viên có nguy cơ rớt môn do điểm Cơ sở dữ liệu và PHP đột ngột giảm sâu.',
      reasons: JSON.stringify([
        { subject: "Cascading Risk (Rủi ro lan truyền)", score: null, r: 1.0, impact: "negative", explanation: "Hổng kiến thức nền tảng do rớt môn tiên quyết 'Lập trình PHP cơ bản' (4.0đ)." },
        { subject: "Lập trình PHP cơ bản", score: 4.0, r: 1.0, impact: "negative", explanation: "⚠️ Lỗ hổng tiên quyết: Lập trình PHP cơ bản = 4.0đ" },
        { subject: "Cơ sở dữ liệu", score: 3.5, r: 0.85, impact: "negative", explanation: "Cơ sở dữ liệu = 3.5 (r=0.85) → kéo xuống" }
      ])
    },
    {
      mssv: 'PS21502',
      courseId: 'Lập trình PHP 1',
      predictedScore: 6.0,
      risk: 'MEDIUM',
      confidence: 0.75,
      explanation: 'Sinh viên học chăm chỉ (chuyên cần 100%) nhưng tiếp thu chậm, điểm nền yếu.',
      reasons: JSON.stringify([
        { subject: "Nhập môn lập trình", score: 5.5, r: 0.8, impact: "neutral", explanation: "Nhập môn lập trình = 5.5 (r=0.8) → trung bình" },
        { subject: "Cơ sở dữ liệu", score: 4.5, r: 0.85, impact: "negative", explanation: "Cơ sở dữ liệu = 4.5 (r=0.85) → kéo xuống" }
      ])
    },
    {
      mssv: 'PS20788',
      courseId: 'Dự án 1',
      predictedScore: 3.8,
      risk: 'HIGH',
      confidence: 0.92,
      explanation: 'Sinh viên bị hổng kiến thức nền nghiêm trọng ngay từ đầu.',
      reasons: JSON.stringify([
        { subject: "Cascading Risk (Rủi ro lan truyền)", score: null, r: 1.0, impact: "negative", explanation: "Hổng kiến thức nền tảng do rớt môn tiên quyết 'Nhập môn lập trình' (2.0đ)." },
        { subject: "Nhập môn lập trình", score: 2.0, r: 1.0, impact: "negative", explanation: "⚠️ Lỗ hổng tiên quyết: Nhập môn lập trình = 2.0đ" }
      ])
    }
  ];

  await prisma.$transaction(
    demoPredictions.map(p => prisma.prediction.create({ data: p }))
  );
  console.log('✅ AI Predictions seeded.');

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
