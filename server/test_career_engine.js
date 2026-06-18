const { prisma } = require('./src/infrastructure/database/prisma');
const { suggestBestCareers } = require('./src/modules/advisor/career-engine');
const knowledgeCache = require('./src/modules/knowledge/cache');
const syllabusLoader = require('./src/modules/data/syllabusLoader');

async function runTest() {
  console.log('--- CAREER ENGINE TEST ---');
  
  // Initialize caches
  knowledgeCache.init();
  syllabusLoader.init();

  // Create a mock student to test
  const testStudentMssv = 'TEST_SV_001';
  
  try {
    // 1. Prepare Mock Data
    const student = await prisma.student.upsert({
      where: { mssv: testStudentMssv },
      update: { name: 'Nguyễn Văn Test', classCode: 'WD18301' },
      create: { mssv: testStudentMssv, name: 'Nguyễn Văn Test', classCode: 'WD18301' }
    });

    // Add some moderate scores
    const scores = [
      { courseId: 'WEB1013', value: 7.5, status: 'PASSED' },
      { courseId: 'WEB1043', value: 8.0, status: 'PASSED' },
      { courseId: 'WEB2014', value: 6.5, status: 'PASSED' }, // Frontend
      { courseId: 'PRO1014', value: 9.0, status: 'PASSED' }  // Project
    ];

    for (const sc of scores) {
      await prisma.score.upsert({
        where: { mssv_courseId_semester: { mssv: testStudentMssv, courseId: sc.courseId, semester: 'Summer 2025' } },
        update: { value: sc.value, status: sc.status },
        create: { mssv: testStudentMssv, courseId: sc.courseId, value: sc.value, status: sc.status, semester: 'Summer 2025' }
      });
    }

    // Fetch full student to pass to the engine
    const fullStudent = await prisma.student.findUnique({
      where: { mssv: testStudentMssv },
      include: {
        scores: { include: { course: true } }
      }
    });

    // 2. Run the Career Engine
    console.log(`\nTesting Career Engine for ${testStudentMssv}...`);
    const results = suggestBestCareers(fullStudent);
    
    // 3. Output results
    console.log('\nTop 3 Career Matches:');
    results.slice(0, 3).forEach((match, i) => {
      console.log(`\n${i + 1}. ${match.careerName}`);
      console.log(`   - Final Readiness Score: ${match.readinessScore}%`);
      console.log(`   - Matched Skills: ${match.matchedSkills.length}`);
      console.log(`   - Missing Skills: ${match.missingSkills.length}`);
    });

  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
