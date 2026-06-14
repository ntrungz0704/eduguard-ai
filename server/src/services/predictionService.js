/**
 * Service to handle student subject grade predictions.
 * Ensures we return 'insufficient_data' for students with no studying history.
 */
function getStudentPredictions(student) {
  if (!student) {
    return {
      predictions: [],
      insufficientData: true
    };
  }

  const scores = student.scores || [];
  const predictions = student.predictions || [];

  // Check if student has absolutely no grades yet
  const completedScores = scores.filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));
  
  if (completedScores.length === 0) {
    return {
      predictions: [],
      insufficientData: true
    };
  }

  return {
    predictions: predictions.map(p => ({
      courseId: p.courseId,
      predictedScore: p.predictedScore,
      risk: p.risk,
      reasons: p.reasons ? JSON.parse(p.reasons) : []
    })),
    insufficientData: false
  };
}

module.exports = {
  getStudentPredictions
};
