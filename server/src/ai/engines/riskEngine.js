const { calculateFptGPA } = require('../../utils/dataService');
const { RISK_WEIGHTS, RISK_LEVELS, RISK_THRESHOLDS } = require('../config/riskRules');

function getRiskLevel(score) {
  if (score >= 76) return RISK_LEVELS.CRITICAL;
  if (score >= 51) return RISK_LEVELS.HIGH;
  if (score >= 26) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

/**
 * Calculates raw base risk score using Configuration Rules.
 */
function calculateBaseRisk(student) {
  if (!student || !student.scores || student.scores.length === 0) {
    return { riskScore: 0, level: 'LOW', gpa: 0, avgAttendance: 100, failedCourses: [], labCourses: [], factors: {} };
  }

  let totalScore = 0;
  const factors = {};

  // 1. LOW GPA
  const gpaData = calculateFptGPA(student.scores);
  const gpa = gpaData.gpa;
  let gpaScore = 0;
  if (gpa < RISK_THRESHOLDS.MIN_PASS_SCORE && student.scores.length > 5) gpaScore = 100;
  else if (gpa < 6.0) gpaScore = 70;
  else if (gpa < 7.0) gpaScore = 30;
  
  factors.LOW_GPA = Math.round(gpaScore * RISK_WEIGHTS.LOW_GPA);
  totalScore += factors.LOW_GPA;

  // 2. ATTENDANCE
  const studyingCourses = student.scores.filter(s => s.status === 'STUDYING' || s.status === 'FAILED');
  const avgAttendance = studyingCourses.length > 0
    ? studyingCourses.reduce((sum, s) => sum + (s.attendance || 100), 0) / studyingCourses.length
    : 100;
  let attendanceScore = 0;
  if (avgAttendance < RISK_THRESHOLDS.ATTENDANCE_CRITICAL) attendanceScore = 100;
  else if (avgAttendance < RISK_THRESHOLDS.ATTENDANCE_WARNING) attendanceScore = 80;
  else if (avgAttendance < RISK_THRESHOLDS.ATTENDANCE_NOTICE) attendanceScore = 55;
  else if (avgAttendance < 90) attendanceScore = 20;

  factors.ATTENDANCE_DROP = Math.round(attendanceScore * RISK_WEIGHTS.ATTENDANCE_DROP);
  totalScore += factors.ATTENDANCE_DROP;

  // 3. BEHAVIOR ANOMALY
  // Phân tích hành vi: nộp bài muộn, vi phạm nội quy, v.v. (tạm tính dựa trên số môn rớt hoặc điểm 0)
  const failedCourses = student.scores.filter(s => s.status === 'FAILED' || (s.value !== null && s.value < RISK_THRESHOLDS.MIN_PASS_SCORE));
  const zeroScores = student.scores.filter(s => s.value === 0);
  let behaviorScore = 0;
  if (zeroScores.length >= 2) behaviorScore = 100;
  else if (zeroScores.length === 1) behaviorScore = 60;
  else if (failedCourses.length > 3) behaviorScore = 80;
  
  factors.BEHAVIOR_ANOMALY = Math.round(behaviorScore * RISK_WEIGHTS.BEHAVIOR_ANOMALY);
  totalScore += factors.BEHAVIOR_ANOMALY;

  // 4. PREREQUISITE BREAK
  const prereqFailed = failedCourses.filter(s => {
    const match = (s.courseId || '').match(/\d+/);
    return match && parseInt(match[0]) <= 200;
  });
  let prereqScore = 0;
  if (prereqFailed.length > 0) prereqScore = prereqFailed.length >= 2 ? 100 : 60;
  
  factors.PREREQUISITE_BREAK = Math.round(prereqScore * RISK_WEIGHTS.PREREQUISITE_BREAK);
  totalScore += factors.PREREQUISITE_BREAK;

  // 5. TREND DECLINE
  const scoredSubjects = student.scores.filter(s => s.value !== null && s.status !== 'STUDYING');
  let trendScore = 0;
  if (scoredSubjects.length >= 4) {
    const half = Math.floor(scoredSubjects.length / 2);
    const earlyAvg = scoredSubjects.slice(0, half).reduce((s, c) => s + c.value, 0) / half;
    const lateAvg = scoredSubjects.slice(half).reduce((s, c) => s + c.value, 0) / (scoredSubjects.length - half);
    if ((earlyAvg - lateAvg) > RISK_THRESHOLDS.GPA_CRITICAL_DROP) trendScore = 100;
    else if ((earlyAvg - lateAvg) > RISK_THRESHOLDS.GPA_WARNING_DROP) trendScore = 50;
  } else if (gpa < RISK_THRESHOLDS.MIN_PASS_SCORE && scoredSubjects.length > 0) {
    trendScore = 60;
  }
  factors.TREND_DECLINE = Math.round(trendScore * RISK_WEIGHTS.TREND_DECLINE);
  totalScore += factors.TREND_DECLINE;

  const riskScore = Math.min(100, Math.round(totalScore));
  const confidenceScore = Math.min(99, Math.round(80 + (scoredSubjects.length * 1.5))); // Confidence based on data points
  return {
    riskScore,
    level: getRiskLevel(riskScore).label,
    confidenceScore,
    gpa,
    avgAttendance,
    failedCourses,
    zeroScores,
    factors
  };
}

module.exports = {
  calculateBaseRisk,
  getRiskLevel,
  RISK_LEVELS
};
