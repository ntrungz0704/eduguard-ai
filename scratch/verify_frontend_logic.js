const { PrismaClient } = require('../generated/prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const fs = require('fs');
const path = require('path');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

function getCourseCredits(courseNameOrId) {
  const name = String(courseNameOrId || '').trim();
  const lower = name.toLowerCase();
  const code = name.toUpperCase();

  if (lower.includes('thể chất') || lower.includes('vovinam') || code.includes('VIE103')) return 2;
  if (lower.includes('quốc phòng') || lower.includes('gdqp') || code.includes('VIE104')) return 4;
  if (lower.includes('thực tập tốt nghiệp') || code.includes('PRO115') || code.includes('PRO110') || code.includes('PRO116')) return 5;
  if (lower.includes('chính trị') || code.includes('VIE108')) return 5;
  if (lower.includes('dự án tốt nghiệp') || code.includes('PRO2201') || code.includes('PRO220')) return 5;

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

const isConditionalCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase();
  return (
    name.includes('thể chất') ||
    name.includes('quốc phòng') ||
    name.includes('thực tập tốt nghiệp') ||
    name.includes('vovinam') ||
    name.includes('gdqp') ||
    cid.includes('VIE103') ||
    cid.includes('VIE104') ||
    cid.includes('PRO110') ||
    cid.includes('PRO115') ||
    cid.includes('PRO116')
  );
};

const get40Scale = (val) => {
  if (val === null || val === undefined) return 0.0;
  if (val >= 9.0) return 4.0;
  if (val >= 8.5) return 3.75;
  if (val >= 8.0) return 3.5;
  if (val >= 7.5) return 3.25;
  if (val >= 7.0) return 3.0;
  if (val >= 6.5) return 2.75;
  if (val >= 6.0) return 2.5;
  if (val >= 5.5) return 2.0;
  if (val >= 5.0) return 1.5;
  if (val >= 4.0) return 1.0;
  return 0.0;
};

const calculateFptStats = (curriculumCourses) => {
  const completed = (curriculumCourses || []).filter(c => c.status === 'PASSED' || c.status === 'FAILED');
  const validScores = completed.filter(c => typeof c.value === 'number');
  
  const academicScores = validScores.filter(s => !isConditionalCourse(s.courseId, s.courseId));
  
  let totalScoreWeight10 = 0;
  let totalScoreWeight4 = 0;
  let totalAcademicCredits = 0;
  
  academicScores.forEach(s => {
    const credits = getCourseCredits(s.courseId);
    totalScoreWeight10 += (s.value * credits);
    totalScoreWeight4 += (get40Scale(s.value) * credits);
    totalAcademicCredits += credits;
  });
  
  let totalEarnedCredits = 0;
  validScores.forEach(s => {
    if (s.value >= 5.0 || s.status === 'PASSED') {
      totalEarnedCredits += getCourseCredits(s.courseId);
    }
  });
  
  const gpa10 = totalAcademicCredits === 0 ? 0.0 : Math.floor(((totalScoreWeight10 / totalAcademicCredits) + 1e-9) * 10) / 10;
  const gpa4 = totalAcademicCredits === 0 ? 0.0 : Math.floor(((totalScoreWeight4 / totalAcademicCredits) + 1e-9) * 100) / 100;
  
  return {
    gpa10,
    gpa4,
    totalEarnedCredits
  };
};

async function main() {
  const trainingData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'training_data.json'), 'utf8'));
  const curriculum = trainingData.curriculumOrder || [];

  const studentScores = await prisma.score.findMany({
    where: { mssv: 'PS47261' },
    include: { course: true }
  });
  const predictions = [];

  const scoreMap = {};
  studentScores.forEach(s => {
    scoreMap[s.courseId] = s;
  });

  const predictionMap = {};
  predictions.forEach(p => {
    predictionMap[p.courseId] = p;
  });

  // Soft-matching helpers
  const findMatchingScore = (currId) => {
    if (scoreMap[currId]) return scoreMap[currId];
    const cleanCurr = currId.toLowerCase().trim();
    return studentScores.find(s => {
      const cleanS = s.courseId.toLowerCase().trim();
      return (
        cleanS.includes(cleanCurr) ||
        cleanCurr.includes(cleanS) ||
        (cleanCurr.includes('thể chất') && cleanS.includes('thể chất')) ||
        (cleanCurr.includes('dự án mẫu') && cleanS.includes('dự án mẫu'))
      );
    });
  };

  const findMatchingPrediction = (currId) => {
    if (predictionMap[currId]) return predictionMap[currId];
    const cleanCurr = currId.toLowerCase().trim();
    return predictions.find(p => {
      const cleanP = p.courseId.toLowerCase().trim();
      return (
        cleanP.includes(cleanCurr) ||
        cleanCurr.includes(cleanP) ||
        (cleanCurr.includes('thể chất') && cleanP.includes('thể chất')) ||
        (cleanCurr.includes('dự án mẫu') && cleanP.includes('dự án mẫu'))
      );
    });
  };

  // Dynamic mapping (same as in StudentDashboard.jsx)
  const curriculumCourses = curriculum.map(courseId => {
    const scoreObj = findMatchingScore(courseId);
    const predObj = findMatchingPrediction(courseId);
    
    let status = 'NOT_STARTED';
    let value = null;
    let isPredicted = false;
    let credits = getCourseCredits(courseId);
    let semester = '';

    if (scoreObj) {
      value = scoreObj.value;
      status = scoreObj.status;
      credits = getCourseCredits(scoreObj.courseId || courseId);
      semester = scoreObj.semester;
    }

    if (predObj) {
      status = 'STUDYING';
      value = predObj.predictedScore;
      isPredicted = true;
    }

    return {
      courseId,
      value,
      status,
      credits,
      isPredicted,
      semester
    };
  });

  console.log('--- CURRICULUM COURSES MAPPING STATUS ---');
  curriculumCourses.forEach((c, idx) => {
    console.log(`${idx+1}. Course: "${c.courseId}", Value: ${c.value}, Status: "${c.status}", Credits: ${c.credits}`);
  });

  const stats = calculateFptStats(curriculumCourses);
  console.log('\n--- CALCULATED DASHBOARD STATS ---');
  console.log(`GPA 10 (System): ${stats.gpa10}`);
  console.log(`GPA 4 (System): ${stats.gpa4}`);
  console.log(`Total Earned Credits (System): ${stats.totalEarnedCredits}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
