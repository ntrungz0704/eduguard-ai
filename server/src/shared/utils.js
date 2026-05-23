/**
 * Calculate Risk Score based on GPA and failures
 */
function calculateRiskScore(student) {
  const gpa = student.gpa || 0;
  const attendance = student.attendance || 100;
  const failedSubjects = student.failedSubjects || 0;

  let riskScore = 0;

  if (gpa < 5) riskScore += 0.5;
  else if (gpa < 6.5) riskScore += 0.2;

  if (attendance < 80) riskScore += 0.3;
  if (failedSubjects > 0) riskScore += 0.1 * failedSubjects;

  return Math.min(1.0, riskScore);
}

/**
 * Classify Risk Level based on prediction score
 */
function classifyRiskLevel(predictedScore) {
  if (predictedScore < 5) return 'high';
  if (predictedScore < 6.5) return 'medium';
  return 'low';
}

module.exports = {
  calculateRiskScore,
  classifyRiskLevel
};
