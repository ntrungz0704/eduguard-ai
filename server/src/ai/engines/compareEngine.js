const { calculateBaseRisk } = require('./riskEngine');

/**
 * Compare Engine
 */
function compareStudents(student1, student2) {
  const r1 = calculateBaseRisk(student1);
  const r2 = calculateBaseRisk(student2);

  let moreCritical = '';
  let reason = '';

  if (r1.riskScore > r2.riskScore) {
    moreCritical = student1.mssv || student1.id;
    reason = `Risk Score cao hơn (${r1.riskScore} vs ${r2.riskScore}).`;
  } else if (r2.riskScore > r1.riskScore) {
    moreCritical = student2.mssv || student2.id;
    reason = `Risk Score cao hơn (${r2.riskScore} vs ${r1.riskScore}).`;
  } else {
    if (r1.failedCourses.length > r2.failedCourses.length) {
      moreCritical = student1.mssv || student1.id;
      reason = `Nợ nhiều môn hơn (${r1.failedCourses.length} vs ${r2.failedCourses.length}).`;
    } else {
      moreCritical = student2.mssv || student2.id;
      reason = `Mức độ rủi ro tương đương. Cần xem xét chi tiết XAI.`;
    }
  }

  return {
    student1: { mssv: student1.mssv || student1.id, riskScore: r1.riskScore, level: r1.level },
    student2: { mssv: student2.mssv || student2.id, riskScore: r2.riskScore, level: r2.level },
    priority: moreCritical,
    reason
  };
}

module.exports = {
  compareStudents
};
