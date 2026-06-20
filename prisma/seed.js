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
  'Tiếng Anh 1.2': 'ENT1227',
  'Giáo dục chính trị': 'VIE1016',
  'Chính trị': 'VIE1016',
  'Xây dựng trang Web': 'WEB1013',
  'Lập trình cơ sở với JavaScript': 'WEB1043',
  'Lập trình PHP cơ bản': 'WEB108',
  'Tiếng Anh 2.1': 'ENT2127',
  'Kỹ năng phát triển bản thân': 'PDP103',
  'Thiết kế UI/UX': 'WEB105',
  'Lập trình PHP 1': 'WEB2014',
  'Dự án mẫu': 'WEB2041',
  'Dự án mẫu (TKTW)': 'WEB2041',
  'Thiết kế Web với HTML5 & CSS3': 'WEB3023',
  'Thiết kế Web với HTML5&CSS3': 'WEB3023',
  'Tiếng Anh 2.2': 'ENT2227',
  'Dự án 1': 'PRO1014',
  'Dự án 1 (TKTW)': 'PRO1014',
  'Quản trị website': 'WEB1023',
  'Marketing trên Internet': 'WEB2053',
  'Lập trình Javascript nâng cao': 'WEB2064',
  'Lập trình JavaScript nâng cao': 'WEB2064',
  'Lập trình ECMAScript': 'WEB501',
  'Kỹ năng làm việc': 'PDP104',
  'Khởi sự doanh nghiệp': 'SYB3013',
  'Lập trình Front-End Framework 1': 'WEB2081',
  'Lập trình Front-End Framework 2': 'WEB2091',
  'Lập trình TypeScript': 'WEB502',
  'NodeJS & Restful Web Service': 'WEB503',
  'Thực tập tốt nghiệp': 'PRO116',
  'Thực tập tốt nghiệp (TKTW)': 'PRO116',
  'Dự án tốt nghiệp': 'PRO220',
  'Dự án tốt nghiệp (TKTW-Single page Application)': 'PRO220',
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
  console.log('🌱 Start seeding historical training data (upsert mode - preserves new data)...');
  
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
  
  // =====================================================
  // UPSERT MODE: Không xóa DB, chỉ thêm/cập nhật dữ liệu gốc
  // SV mới thêm qua app sẽ được GIỮ NGUYÊN
  // =====================================================

  // 1. Upsert Demo Users
  console.log('👤 Upserting Demo Users...');
  await prisma.user.upsert({
    where: { email: 'admin@eduguard.ai' },
    update: { name: 'Admin EduGuard', role: 'ADMIN' },
    create: { email: 'admin@eduguard.ai', name: 'Admin EduGuard', role: 'ADMIN' }
  });
  await prisma.user.upsert({
    where: { email: 'advisor@eduguard.ai' },
    update: { name: 'Advisor Demo', role: 'ADVISOR' },
    create: { email: 'advisor@eduguard.ai', name: 'Advisor Demo', role: 'ADVISOR' }
  });
  console.log('✅ Demo users ready.');
  
  // 2. Extract and Upsert all unique Courses
  console.log('📚 Scanning and Upserting Courses dynamically...');
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
  console.log(`✅ ${courseIds.size} unique courses ready.`);
  
  // 3. Upsert Students (giữ nguyên SV mới thêm qua app)
  console.log('👥 Upserting student profiles...');
  const BATCH_SIZE = 50; // Smaller batch for upsert operations
  let upsertedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map(s => prisma.student.upsert({
        where: { mssv: s.id },
        update: {}, // Không ghi đè name/classCode nếu đã tồn tại (có thể đã được sửa qua app)
        create: {
          mssv: s.id,
          name: s.name || `Sinh viên ${s.id}`,
          classCode: 'WD18301',
        }
      }))
    );
    upsertedCount += batch.length;
  }
  console.log(`✅ ${upsertedCount} student profiles ready (existing students preserved).`);
  
  // 4. Upsert Scores (chỉ chèn điểm gốc nếu chưa có, không ghi đè điểm mới)
  console.log('✍️ Upserting student score history...');
  let scoreCount = 0;
  
  for (const s of students) {
    const mssv = s.id;
    const scoreEntries = Object.entries(s.scores || {}).filter(([, v]) => v !== null);
    
    for (let i = 0; i < scoreEntries.length; i += BATCH_SIZE) {
      const batch = scoreEntries.slice(i, i + BATCH_SIZE);
      for (const [subName, scoreVal] of batch) {
        const courseId = normalizeCourseId(subName);
        const status = (scoreVal >= 5) ? 'PASSED' : 'FAILED';
        
        // Kiểm tra xem điểm đã tồn tại chưa (theo mssv + courseId)
        const existing = await prisma.score.findFirst({
          where: { mssv, courseId }
        });
        
        if (!existing) {
          await prisma.score.create({
            data: {
              mssv,
              courseId,
              value: scoreVal,
              semester: 'Summer 2025',
              status,
            }
          });
          scoreCount++;
        }
      }
    }
  }
  console.log(`✅ Score history ready (${scoreCount} new records inserted, existing scores preserved).`);

  // 5. Upsert Special Demo Cases
  console.log('🎭 Upserting Special Demo Cases...');
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

  for (const s of demoStudents) {
    await prisma.student.upsert({
      where: { mssv: s.mssv },
      update: {},
      create: { mssv: s.mssv, name: s.name, classCode: s.classCode }
    });
  }

  for (const s of demoStudents) {
    for (const [courseId, scoreData] of Object.entries(s.scores)) {
      if (scoreData.value === null) continue;
      const cId = normalizeCourseId(courseId);
      const existing = await prisma.score.findFirst({
        where: { mssv: s.mssv, courseId: cId }
      });
      if (!existing) {
        await prisma.score.create({
          data: {
            mssv: s.mssv,
            courseId: cId,
            value: scoreData.value,
            status: scoreData.status,
            attendance: scoreData.attendance,
            semester: 'Fall 2025'
          }
        });
      }
    }
  }
  
  // 6. Upsert Predictions for Demo Cases
  console.log('🔮 Upserting AI Predictions for Demo Cases...');
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

  for (const p of demoPredictions) {
    const existing = await prisma.prediction.findFirst({
      where: { mssv: p.mssv, courseId: p.courseId }
    });
    if (!existing) {
      await prisma.prediction.create({ data: p });
    }
  }
  console.log('✅ AI Predictions ready.');

  // 7. Upsert Learning Boards and Tasks for Career Distribution Demo
  console.log('📋 Upserting Learning Boards and Tasks for Career Distribution Dashboard...');
  
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
  
  console.log(`🚀 Upserting ${boardsToCreate.length} Learning Boards...`);
  for (const b of boardsToCreate) {
    await prisma.learningBoard.upsert({
      where: { id: b.id },
      update: {},
      create: b
    });
  }
  
  console.log(`🚀 Upserting ${tasksToCreate.length} Learning Tasks...`);
  for (const t of tasksToCreate) {
    const existing = await prisma.learningTask.findFirst({
      where: { boardId: t.boardId, taskId: t.taskId }
    });
    if (!existing) {
      await prisma.learningTask.create({ data: t });
    }
  }
  console.log('✅ Learning Boards and Tasks ready.');

  // 8. Thống kê cuối cùng
  const totalStudents = await prisma.student.count();
  const totalScores = await prisma.score.count();
  console.log(`\n📊 Database Summary: ${totalStudents} students, ${totalScores} scores in DB.`);
  console.log('🎉 Seeding completed successfully! (All existing data preserved)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
