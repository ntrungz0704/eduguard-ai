const { calculateBaseRisk, getRiskLevel, RISK_LEVELS } = require('./riskEngine');
const { explainRisk } = require('./xaiEngine');
const { getPriorityList } = require('./priorityEngine');
const { compareStudents } = require('./compareEngine');
const { forecastTrend } = require('./forecastEngine');
const { simulateScenario } = require('./scenarioEngine');
const { generateRecommendations } = require('./recommendationEngine');
const { logAction } = require('./auditEngine');

// Legacy compatibility for Timeline & Class Analytics
function generateAcademicTimeline(student, riskData) {
  const timeline = [];
  if (riskData.level === 'CRITICAL') timeline.push({ week: 4, type: 'CRITICAL', event: 'Cảnh báo nguy cơ đình chỉ học tập.'});
  else if (riskData.level === 'HIGH') timeline.push({ week: 6, type: 'WARNING', event: 'Cần gặp cố vấn học tập ngay.'});
  else timeline.push({ week: 8, type: 'SUCCESS', event: 'Học lực ổn định.'});
  return timeline;
}

function computeClassAnalytics(students) {
  const riskProfiles = students.map(s => {
    const risk = calculateBaseRisk(s);
    return { mssv: s.mssv || s.id, name: s.name, ...risk };
  }).sort((a, b) => b.riskScore - a.riskScore);

  return {
    total: students.length,
    criticals: riskProfiles.filter(r => r.level === 'CRITICAL').length,
    highs: riskProfiles.filter(r => r.level === 'HIGH').length,
    mediums: riskProfiles.filter(r => r.level === 'MEDIUM').length,
    lows: riskProfiles.filter(r => r.level === 'LOW').length,
    topAtRisk: riskProfiles.slice(0, 5)
  };
}

module.exports = {
  calculateBaseRisk,
  explainRisk,
  getPriorityList,
  compareStudents,
  forecastTrend,
  simulateScenario,
  generateRecommendations,
  logAction,
  generateAcademicTimeline,
  computeClassAnalytics,
  getRiskLevel,
  RISK_LEVELS
};
