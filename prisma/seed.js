const { PrismaClient } = require('../server/generated/prisma');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize the Prisma 7 client with the SQLite Driver Adapter
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

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
  await prisma.score.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Database cleaned.');

  // 1.5. Seed Demo Users
  console.log('👤 Seeding Demo Users...');
  await prisma.user.createMany({
    data: [
      { email: 'admin@eduguard.ai', name: 'Admin EduGuard', role: 'ADMIN' },
      { email: 'advisor@eduguard.ai', name: 'Advisor Demo', role: 'ADVISOR' }
    ]
  });
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
        'Cơ sở dữ liệu': { value: 3.5, status: 'FAILED', attendance: 0.40 }, // Sudden drop
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
        'Nhập môn lập trình': { value: 2.0, status: 'FAILED', attendance: 0.8 }, // Failed Core Prereq
        'Xây dựng trang Web': { value: 6.0, status: 'PASSED', attendance: 0.9 },
        'Cơ sở dữ liệu': { value: null, status: 'STUDYING', attendance: 0.85 }
      }
    }
  ];

  await prisma.student.createMany({
    data: demoStudents.map(s => ({ mssv: s.mssv, name: s.name, classCode: s.classCode }))
  });

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
  await prisma.score.createMany({ data: demoScores });
  console.log('✅ Special Demo Cases Seeded.');

  // 6. Seed Predictions for Demo Cases
  console.log('🔮 Seeding Predictions for Demo Cases...');
  const demoPredictions = [
    {
      mssv: 'PS21034',
      courseId: 'Lập trình Front-End Framework 1',
      predictedScore: 4.0,
      risk: 'HIGH',
      confidence: 0.85,
      explanation: 'Sự sụt giảm phong độ đột ngột ở CSDL và PHP.',
      reasons: [
        { subject: 'Cơ sở dữ liệu', score: 3.5, r: 0.6, impact: 'negative', explanation: 'Điểm rất thấp ở môn tiên quyết' },
        { subject: 'Lập trình PHP cơ bản', score: 4.0, r: 0.7, impact: 'negative', explanation: 'Điểm rất thấp ở môn tiên quyết' }
      ]
    },
    {
      mssv: 'PS21502',
      courseId: 'Lập trình Front-End Framework 1',
      predictedScore: 5.5,
      risk: 'MEDIUM',
      confidence: 0.80,
      explanation: 'Cần cải thiện kiến thức nền tảng.',
      reasons: [
        { subject: 'Cơ sở dữ liệu', score: 4.5, r: 0.6, impact: 'negative', explanation: 'Điểm dưới trung bình' }
      ]
    },
    {
      mssv: 'PS20788',
      courseId: 'Lập trình Front-End Framework 1',
      predictedScore: 3.5,
      risk: 'HIGH',
      confidence: 0.90,
      explanation: 'Hổng kiến thức nền tảng lập trình rất nặng.',
      reasons: [
        { subject: 'Nhập môn lập trình', score: 2.0, r: 0.8, impact: 'negative', explanation: 'Gãy môn tiên quyết quan trọng nhất' }
      ]
    }
  ];

  // Pick 47 random students from the dataset to make the dashboard look bustling (50 at risk total)
  const additionalDemo = students.filter(s => s.id.startsWith('PS') && !['PS21034', 'PS21502', 'PS20788'].includes(s.id)).slice(0, 47);
  for (const s of additionalDemo) {
    demoPredictions.push({
      mssv: s.id,
      courseId: 'Lập trình Front-End Framework 2',
      predictedScore: (Math.random() * 2 + 3).toFixed(1) * 1, // 3.0 -> 5.0
      risk: 'HIGH',
      confidence: 0.75 + Math.random() * 0.15,
      explanation: 'Thuật toán dự báo nguy cơ cao dựa trên lịch sử điểm các môn tiên quyết.',
      reasons: [ { subject: 'Lập trình Front-End Framework 1', score: 4.5, r: 0.75, impact: 'negative', explanation: 'Môn tiên quyết chưa đạt yêu cầu' } ]
    });
  }

  await prisma.prediction.createMany({
    data: demoPredictions
  });
  console.log('✅ 50 Predictions Seeded for Dashboard.');

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
