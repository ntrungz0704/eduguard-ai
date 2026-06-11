const fs = require('fs');
const path = require('path');

const { prisma } = require('../server/src/infrastructure/database/prisma');

const COURSE_NAME_TO_CODE = {
  'Tin học': 'COM1071',
  'Nhập môn lập trình': 'COM108',
  'Tiếng Anh 1.1': 'ENT1128',
  'Nhập môn Công nghệ thông tin': 'ITI101',
  'Nhập môn công nghệ thông tin': 'ITI101',
  'Kỹ năng học tập': 'PDP102',
  'Giáo dục thể chất': 'VIE103',
  'Giáo dục thể chất - Vovinam': 'VIE103',
  'Cơ sở dữ liệu': 'COM2012',
  'Tiếng Anh 1.2': 'ENT123',
  'Giáo dục chính trị': 'VIE108',
  'Chính trị': 'VIE108',
  'Xây dựng trang Web': 'WEB1013',
  'Lập trình cơ sở với JavaScript': 'WEB1043',
  'Lập trình PHP cơ bản': 'WEB108',
  'Tiếng Anh 2.1': 'ENT213',
  'Kỹ năng phát triển bản thân': 'PDP103',
  'Thiết kế UI/UX': 'WEB105',
  'Lập trình PHP 1': 'WEB2014',
  'Dự án mẫu': 'WEB2041',
  'Dự án mẫu (TKTW)': 'WEB2041',
  'Thiết kế Web với HTML5 & CSS3': 'WEB3023',
  'Thiết kế Web với HTML5&CSS3': 'WEB3023',
  'Tiếng Anh 2.2': 'ENT223',
  'Dự án 1': 'PRO1014',
  'Dự án 1 (TKTW)': 'PRO1014',
  'Quản trị website': 'WEB1023',
  'Marketing trên Internet': 'WEB2055',
  'Lập trình Javascript nâng cao': 'WEB2063',
  'Lập trình JavaScript nâng cao': 'WEB2063',
  'Lập trình ECMAScript': 'WEB501',
  'Kỹ năng làm việc': 'PDP104',
  'Khởi sự doanh nghiệp': 'SYB3013',
  'Lập trình Front-End Framework 1': 'WEB2081',
  'Lập trình Front-End Framework 2': 'WEB2091',
  'Lập trình TypeScript': 'WEB502',
  'NodeJS & Restful Web Service': 'WEB503',
  'Thực tập tốt nghiệp': 'PRO116',
  'Thực tập tốt nghiệp (TKTW)': 'PRO116',
  'Dự án tốt nghiệp': 'PRO2201',
  'Dự án tốt nghiệp (TKTW-Single page Application)': 'PRO2201',
  'Pháp luật': 'VIE1026',
  'Giáo dục quốc phòng': 'VIE104'
};

const COURSE_CODE_TO_NAME = Object.fromEntries(
  Object.entries(COURSE_NAME_TO_CODE).map(([name, code]) => [code, name])
);

const normalizeCourseId = (courseNameOrId) => {
  const raw = String(courseNameOrId || '').trim();
  return COURSE_NAME_TO_CODE[raw] || raw.toUpperCase();
};

const getCourseName = (courseNameOrId) => {
  const raw = String(courseNameOrId || '').trim();
  const code = normalizeCourseId(raw);
  return COURSE_CODE_TO_NAME[code] || raw;
};

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
  const courseIds = new Map();
  subjects.forEach(subject => courseIds.set(normalizeCourseId(subject), getCourseName(subject)));
  for (const s of students) {
    if (s.scores) {
      for (const subName of Object.keys(s.scores)) {
        courseIds.set(normalizeCourseId(subName), getCourseName(subName));
      }
    }
  }
  
  const { getCourseCredits } = require('../server/src/utils/dataService');

  // Use upsert for courses sequentially (works on SQLite, avoids Prisma Rust Engine panic)
  for (const [id, name] of courseIds.entries()) {
    const credits = getCourseCredits(id);
    await prisma.course.upsert({
      where: { id },
      update: { credits },
      create: {
        id,
        name,
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
  // Batch in chunks to avoid SQLite variables limits
  const BATCH_SIZE = 500;
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
        courseId: normalizeCourseId(subName),
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
        courseId: normalizeCourseId(courseId),
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
      courseId: 'WEB1043',
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
      courseId: 'WEB2014',
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
      courseId: 'PRO1014',
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

  // 7. Seed Learning Boards and Tasks for Career Distribution Demo
  console.log('📋 Seeding Learning Boards and Tasks for Career Distribution Dashboard...');
  
  const frontendCount = 35;
  const backendCount = 20;
  const aiCount = 15;
  
  const seededStudentIds = students.map(s => s.id);
  
  const frontendStudents = seededStudentIds.slice(0, frontendCount);
  const backendStudents = seededStudentIds.slice(frontendCount, frontendCount + backendCount);
  const aiStudents = seededStudentIds.slice(frontendCount + backendCount, frontendCount + backendCount + aiCount);
  
  const boardsToCreate = [];
  const tasksToCreate = [];
  
  const createBoardWithTasks = (studentId, careerId, skillsList) => {
    const boardId = `board_${studentId}_${careerId}`;
    
    boardsToCreate.push({
      id: boardId,
      studentId,
      careerId
    });
    
    skillsList.forEach((skill, idx) => {
      let status = 'TODO';
      let verified = false;
      let evidenceStatus = 'NONE';
      let points = 0;
      let github = null;
      let completedAt = null;
      let startedAt = null;
      
      const rand = Math.random();
      const progressFactor = idx / skillsList.length;
      
      if (progressFactor < 0.4) {
        status = 'DONE';
        completedAt = new Date(Date.now() - Math.floor(Math.random() * 15 + 2) * 24 * 60 * 60 * 1000);
        startedAt = new Date(completedAt.getTime() - Math.floor(Math.random() * 5 + 2) * 24 * 60 * 60 * 1000);
        
        if (rand < 0.6) {
          verified = true;
          evidenceStatus = 'VERIFIED';
          points = Math.random() < 0.5 ? 10 : 20;
          github = `https://github.com/student-${studentId.toLowerCase()}/${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        }
      } else if (progressFactor < 0.6) {
        if (rand < 0.4) {
          status = 'DONE';
          completedAt = new Date(Date.now() - Math.floor(Math.random() * 5 + 1) * 24 * 60 * 60 * 1000);
          startedAt = new Date(completedAt.getTime() - Math.floor(Math.random() * 5 + 2) * 24 * 60 * 60 * 1000);
          if (rand < 0.3) {
            verified = true;
            evidenceStatus = 'VERIFIED';
            points = 10;
            github = `https://github.com/student-${studentId.toLowerCase()}/${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          }
        } else if (rand < 0.8) {
          status = 'IN_PROGRESS';
          startedAt = new Date(Date.now() - Math.floor(Math.random() * 3 + 1) * 24 * 60 * 60 * 1000);
        }
      }
      
      tasksToCreate.push({
        boardId,
        taskId: `${careerId}_task_${idx}`,
        title: skill,
        type: idx < 6 ? 'core' : 'advanced',
        status,
        impact: idx < 6 ? 10 : 15,
        duration: idx < 6 ? '4-6 ngày' : '7-10 ngày',
        startedAt,
        completedAt,
        github,
        evidenceStatus,
        verified,
        points
      });
    });
  };
  
  const frontendSkills = [
    'HTML', 'CSS', 'JavaScript', 'Responsive Design', 'Git and GitHub', 'REST API', 'Package Managers',
    'React', 'Next.js', 'TypeScript', 'State Management', 'CSS Frameworks (Tailwind)', 'Portfolio Project', 'Internship Ready'
  ];
  
  const backendSkills = [
    'Internet', 'JavaScript', 'Node.js Basics', 'Node.js', 'Express', 'Git and GitHub', 'REST API',
    'SQL', 'PostgreSQL', 'Databases', 'NoSQL', 'MongoDB', 'Redis', 'Portfolio Project', 'Internship Ready'
  ];
  
  const aiSkills = [
    'Prompt Engineering', 'Few-Shot Prompting', 'Chain-of-Thought', 'AI Basics',
    'OpenAI API', 'Gemini API', 'RAG', 'Vector Databases', 'LangChain', 'AI Agents', 'Portfolio Project', 'Internship Ready'
  ];
  
  frontendStudents.forEach(id => createBoardWithTasks(id, 'frontend-developer', frontendSkills));
  backendStudents.forEach(id => createBoardWithTasks(id, 'backend-developer', backendSkills));
  aiStudents.forEach(id => createBoardWithTasks(id, 'ai-engineer', aiSkills));
  
  console.log(`🚀 Inserting ${boardsToCreate.length} Learning Boards...`);
  for (let i = 0; i < boardsToCreate.length; i += BATCH_SIZE) {
    const batch = boardsToCreate.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map(b => prisma.learningBoard.create({ data: b }))
    );
  }
  
  console.log(`🚀 Inserting ${tasksToCreate.length} Learning Tasks...`);
  for (let i = 0; i < tasksToCreate.length; i += BATCH_SIZE) {
    const batch = tasksToCreate.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map(t => prisma.learningTask.create({ data: t }))
    );
  }
  console.log('✅ Learning Boards and Tasks seeded.');

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
