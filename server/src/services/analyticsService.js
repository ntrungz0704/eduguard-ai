const { calculateOfficialGPA, getCourseCredits, isConditionalCourse } = require('../utils/dataService');
const { prisma } = require('../infrastructure/database/prisma');
const { eventBus, EVENTS } = require('../utils/eventBus');

// Cache nội bộ (chỉ cache trong thời gian ngắn hoặc khi chưa có event mới)
let analyticsCache = {
  globalStats: null,
  bottlenecks: null,
};

// Invalidate cache khi có DATASET_UPDATED
eventBus.on(EVENTS.DATASET_UPDATED, () => {
  console.log('[AnalyticsService] Nhận sự kiện DATASET_UPDATED. Invalidating cache...');
  clearAnalyticsCache();
});

function clearAnalyticsCache() {
  analyticsCache.globalStats = null;
  analyticsCache.bottlenecks = null;
}

/**
 * Calculates student cumulative and semester-based academic statistics.
 * Ensures 100% database-driven Single Source of Truth for GPA and Credits.
 */
function getStudentAnalytics(student, allStudents = []) {
  if (!student) {
    return {
      gpa10: 0.0,
      gpa4: 0.0,
      totalEarnedCredits: 0,
      semesterStats: [],
      curriculumSemesterStats: [],
      cohortRank: '—',
      totalCohort: '—',
      cohortPercentile: '—',
      academicScoresCount: 0,
      totalScoresCount: 0
    };
  }

  let scores = student.scores || [];
  if (!Array.isArray(scores) && typeof scores === 'object') {
    scores = Object.entries(scores).map(([courseId, val]) => ({
      courseId,
      value: val,
      status: val === null ? 'STUDYING' : ((val >= 5.0) ? 'PASSED' : 'FAILED'),
      course: { id: courseId, name: courseId, credits: getCourseCredits(courseId) }
    }));
  }
  
  // 1. Calculate cumulative GPA using central FPT formula
  const fptGpa = calculateOfficialGPA(scores);
  
  // 2. Calculate actual earned credits
  const totalEarnedCredits = fptGpa.totalCredits;

  // 3. Compute real semester stats (Actual terms like Spring 2025, Fall 2025)
  const completedScores = scores.filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));
  const semesterGroups = {};
  completedScores.forEach(s => {
    const sem = s.semester || 'Chưa rõ';
    if (!semesterGroups[sem]) semesterGroups[sem] = [];
    semesterGroups[sem].push(s);
  });

  const getSemesterVal = (semStr) => {
    const lower = (semStr || '').toLowerCase();
    const match = lower.match(/\d+/);
    const year = match ? parseInt(match[0]) : 2025;
    let term = 0.2;
    if (lower.includes('summer')) term = 0.5;
    if (lower.includes('fall')) term = 0.8;
    return year + term;
  };

  const sortedSemesters = Object.keys(semesterGroups).sort((a, b) => getSemesterVal(a) - getSemesterVal(b));
  
  let accumulatedScores = [];
  const semesterStats = sortedSemesters.map(sem => {
    const semScores = semesterGroups[sem];
    const semGpa = calculateOfficialGPA(semScores);
    
    accumulatedScores = accumulatedScores.concat(semScores);
    const cpaGpa = calculateOfficialGPA(accumulatedScores);

    return {
      semester: sem,
      gpa: semGpa.gpa,
      gpa4: semGpa.gpa_4,
      cpa: cpaGpa.gpa,
      cpa4: cpaGpa.gpa_4,
      credits: semGpa.totalCredits
    };
  });

  // 4. Compute curriculum semester stats (Semester 1 to Semester 6)
  const getCurriculumSemester = (courseId, name) => {
    const cid = String(courseId || '').toUpperCase();
    const n = String(name || '').toLowerCase();
    if (cid.includes('COM1012') || cid.includes('COM1024') || n.includes('tin hoc van phong') || n.includes('tin học văn phòng') || n.includes('nhap mon tin hoc') || n.includes('nhập môn tin học') || cid.includes('VIE103') || n.includes('the chat') || n.includes('thể chất') || n.includes('vovinam') || cid.includes('ENT11') || n.includes('tieng anh 1.1') || n.includes('tiếng anh 1.1') || cid.includes('PDP102') || n.includes('ky nang hoc tap') || n.includes('kỹ năng học tập') || n.includes('phát triển cá nhân 1')) return 1;
    if (cid.includes('WEB1013') || n.includes('thiet ke trang web') || n.includes('thiết kế trang web') || n.includes('html') || cid.includes('WEB105') || n.includes('photoshop') || cid.includes('COM2012') || n.includes('co so du lieu') || n.includes('cơ sở dữ liệu') || cid.includes('VIE1016') || cid.includes('VIE108') || n.includes('chinh tri') || n.includes('chính trị') || cid.includes('ENT12') || n.includes('tieng anh 1.2') || n.includes('tiếng anh 1.2')) return 2;
    if (cid.includes('WEB1043') || cid.includes('WEB2013') || n.includes('javascript') || cid.includes('WEB1053') || n.includes('ui/ux') || cid.includes('WEB2043') || n.includes('du an mau') || n.includes('dự án mẫu') || cid.includes('ENT21') || n.includes('tieng anh 2.1') || n.includes('tiếng anh 2.1') || cid.includes('PDP103') || n.includes('ky nang phat trien ban than') || n.includes('kỹ năng phát triển bản thân') || n.includes('phát triển cá nhân 2')) return 3;
    if (cid.includes('WEB2063') || cid.includes('WEB2062') || n.includes('js nang cao') || n.includes('javascript nâng cao') || cid.includes('ENT22') || n.includes('tieng anh 2.2') || n.includes('tiếng anh 2.2') || cid.includes('WEB1022') || n.includes('quan tri website') || n.includes('quản trị website') || cid.includes('WEB5013') || n.includes('ecmascript') || cid.includes('PRO1014') || n.includes('du an 1') || n.includes('dự án 1') || cid.includes('WEB2053') || n.includes('marketing online') || n.includes('internet marketing')) return 4;
    if (cid.includes('WEB503') || n.includes('nodejs') || n.includes('restful') || cid.includes('WEB502') || n.includes('typescript') || cid.includes('WEB2091') || n.includes('front-end framework 2') || n.includes('framework 2') || cid.includes('PDP104') || n.includes('ky nang lam viec') || n.includes('kỹ năng làm việc') || n.includes('phát triển cá nhân 3') || cid.includes('WEB208') || n.includes('front-end framework 1') || n.includes('framework 1') || cid.includes('SYB301') || n.includes('khoi su doanh nghiep') || n.includes('khởi sự doanh nghiệp')) return 5;
    if (cid.includes('VIE104') || n.includes('quoc phong') || n.includes('quốc phòng') || n.includes('gdqp') || cid.includes('PRO116') || n.includes('thuc tap tot nghiep') || n.includes('thực tập tốt nghiệp') || cid.includes('PRO220') || n.includes('du an tot nghiep') || n.includes('dự án tốt nghiệp') || n.includes('đồ án tốt nghiệp') || cid.includes('VIE102') || n.includes('phap luat') || n.includes('pháp luật')) return 6;
    return 3;
  };

  const curriculumSemesterStats = [];
  let cumCredits = 0;
  let cumWeight10 = 0;
  let cumWeight4 = 0;
  let cumGpaCredits = 0;

  for (let semNum = 1; semNum <= 6; semNum++) {
    const semCourses = scores.filter(s => getCurriculumSemester(s.courseId, s.course?.name || s.courseId) === semNum);
    const completedSemCourses = semCourses.filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));

    const semGpa = calculateOfficialGPA(completedSemCourses);
    
    completedSemCourses.forEach(s => {
      const isCond = isConditionalCourse(s.course?.name || s.courseId, s.courseId);
      const isEng = (s.course?.name || s.courseId || '').toLowerCase().includes('tiếng anh') || 
                    (s.course?.name || s.courseId || '').toLowerCase().includes('tieng anh') || 
                    (s.courseId || '').toUpperCase().includes('ENT');
      const credits = s.course?.credits || getCourseCredits(s.courseId);
      
      if (s.value >= 5.0 || s.value === 1.0) {
        cumCredits += credits;
      }
      
      if (!isCond && !isEng && s.value > 1.0) {
        cumWeight10 += (s.value * credits);
        let score4 = 0.0;
        if (s.value >= 9.0) score4 = 4.0;
        else if (s.value >= 8.0) score4 = 3.5;
        else if (s.value >= 7.0) score4 = 3.0;
        else if (s.value >= 6.0) score4 = 2.5;
        else if (s.value >= 5.0) score4 = 2.0;
        cumWeight4 += (score4 * credits);
        cumGpaCredits += credits;
      }
    });

    const currentCumGpa10 = cumGpaCredits === 0 ? 0.0 : Math.floor(((cumWeight10 / cumGpaCredits) + 1e-9) * 100) / 100;
    const currentCumGpa4 = cumGpaCredits === 0 ? 0.0 : Math.round(((cumWeight4 / cumGpaCredits) + 1e-9) * 100) / 100;

    curriculumSemesterStats.push({
      semesterName: `Kỳ ${semNum}`,
      gpa: completedSemCourses.length === 0 ? null : semGpa.gpa,
      gpa4: completedSemCourses.length === 0 ? null : semGpa.gpa_4,
      cpa: cumGpaCredits === 0 ? null : currentCumGpa10,
      cpa4: cumGpaCredits === 0 ? null : currentCumGpa4,
      creditsEarned: completedSemCourses.reduce((sum, s) => {
        if (s.value >= 5.0 || s.value === 1.0) {
          return sum + (s.course?.credits || getCourseCredits(s.courseId));
        }
        return sum;
      }, 0)
    });
  }

  // 5. Calculate cohort ranking if other students are provided
  let cohortRank = '—';
  let totalCohort = '—';
  let cohortPercentile = '—';

  if (Array.isArray(allStudents) && allStudents.length > 0) {
    totalCohort = allStudents.length;
    const allGPAs = allStudents.map(st => {
      const stScores = st.scores || [];
      const stats = calculateOfficialGPA(stScores);
      return { mssv: st.mssv || st.id, gpa: stats.gpa };
    });
    allGPAs.sort((a, b) => b.gpa - a.gpa);
    const rankIndex = allGPAs.findIndex(g => g.mssv === (student.mssv || student.id));
    if (rankIndex !== -1) {
      cohortRank = rankIndex + 1;
      cohortPercentile = Math.round((cohortRank / totalCohort) * 100 * 10) / 10;
    }
  }

  // 6. Calculate completed and academic scores counts
  const academicScoresCount = completedScores.filter(s => {
    const isCond = (s.course?.name || s.courseId || '').toLowerCase().includes('thể chất') ||
                   (s.course?.name || s.courseId || '').toLowerCase().includes('quốc phòng') ||
                   (s.course?.name || s.courseId || '').toLowerCase().includes('vovinam') ||
                   (s.course?.name || s.courseId || '').toLowerCase().includes('gdqp') ||
                   (s.courseId || '').toUpperCase().includes('VIE103') ||
                   (s.courseId || '').toUpperCase().includes('VIE104') ||
                   (s.courseId || '').toUpperCase().includes('PRO110') ||
                   (s.courseId || '').toUpperCase().includes('PRO115') ||
                   (s.courseId || '').toUpperCase().includes('PRO116');
    const isEng = (s.course?.name || s.courseId || '').toLowerCase().includes('tiếng anh') || 
                  (s.course?.name || s.courseId || '').toLowerCase().includes('tieng anh') || 
                  (s.courseId || '').toUpperCase().includes('ENT');
    return !isCond && !isEng;
  }).length;

  const totalScoresCount = completedScores.length;

  return {
    gpa10: fptGpa.gpa,
    gpa4: fptGpa.gpa_4,
    totalEarnedCredits,
    semesterStats,
    curriculumSemesterStats,
    cohortRank,
    totalCohort,
    cohortPercentile,
    academicScoresCount,
    totalScoresCount
  };
}

/**
 * Lấy Top Môn Nguy Cơ (Bottlenecks)
 * SSOT: Bỏ qua môn điều kiện, chỉ tính môn đã học thật sự (có điểm, PASS/FAIL).
 */
async function getTopBottlenecks() {
  if (analyticsCache.bottlenecks) return analyticsCache.bottlenecks;

  // 1. Chỉ lấy Course không phải môn điều kiện
  const courses = await prisma.course.findMany({
    where: { isConditional: false }
  });
  const validCourseIds = new Set(courses.map(c => c.id));

  // 2. Lấy Scores có điểm thật
  const scores = await prisma.score.findMany({
    where: {
      value: { not: null },
      status: { in: ['PASSED', 'FAILED'] }
    }
  });

  const subjectStats = {};
  
  const { isConditionalCourse } = require('../utils/dataService');
  
  for (const score of scores) {
    if (!validCourseIds.has(score.courseId)) continue;
    if (isConditionalCourse(score.courseId, score.courseId)) continue; // Ensure no conditional courses slip through

    if (!subjectStats[score.courseId]) {
      subjectStats[score.courseId] = {
        subject: score.courseId,
        total: 0,
        failed: 0,
        sum: 0
      };
    }

    subjectStats[score.courseId].total += 1;
    subjectStats[score.courseId].sum += score.value;
    if (score.status === 'FAILED' && score.value < 5.0) {
      subjectStats[score.courseId].failed += 1;
    }
  }

  const bottlenecks = Object.values(subjectStats)
    .filter(s => s.total >= 5) // Môn có >= 5 sinh viên học
    .map(s => ({
      subject: s.subject,
      scored: s.total,
      atRisk: s.failed,
      avg: Math.round((s.sum / s.total) * 10) / 10,
      failureRate: Math.round((s.failed / s.total) * 100)
    }))
    .sort((a, b) => b.atRisk - a.atRisk); // Xếp theo số lượng tạch nhiều nhất

  analyticsCache.bottlenecks = bottlenecks;
  return bottlenecks;
}

/**
 * Lấy Thống kê Tổng quan (Global Stats)
 * SSOT: Điểm duy nhất cho Dashboard, NLP, AI
 */
async function getGlobalStats() {
  if (analyticsCache.globalStats) return analyticsCache.globalStats;

  const totalStudents = await prisma.student.count();
  
  const bottlenecks = await getTopBottlenecks();
  const topRiskSubject = bottlenecks.length > 0 ? bottlenecks[0].subject : 'N/A';

  // Tính tỷ lệ cảnh báo (Giả sử GPA < 5.0 là cảnh báo)
  // Trong thực tế, có thể query phức tạp hơn dựa trên GPA.
  const allStudents = await prisma.student.findMany({
    include: { scores: true }
  });

  let atRiskStudents = 0;
  let trainableStudents = 0;
  allStudents.forEach(st => {
    // Simplify credits mapping, use actual course credits if available
    const scores = st.scores.map(s => ({ value: s.value, courseId: s.courseId, status: s.status })); 
    const gpaResult = calculateOfficialGPA(scores);
    const gpa = gpaResult.gpa;
    if (gpa > 0 && gpa < 5.0) atRiskStudents++;
    
    // Trainable if they have any passed scores
    const hasValidScores = st.scores.some(s => s.status === 'PASSED' && s.value !== null);
    if (hasValidScores) trainableStudents++;
  });

  const warningRate = totalStudents > 0 ? Math.round((atRiskStudents / totalStudents) * 100) : 0;

  const stats = {
    totalStudents,
    trainableStudents,
    topRiskSubject,
    atRiskStudents,
    warningRate
  };

  analyticsCache.globalStats = stats;
  return stats;
}

module.exports = {
  getStudentAnalytics,
  getTopBottlenecks,
  getGlobalStats,
  clearAnalyticsCache
};
