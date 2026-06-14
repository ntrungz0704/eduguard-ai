const { suggestBestCareers, analyzeCareer } = require('../modules/advisor/career-engine');

/**
 * Service to handle student career suggestions and path mapping.
 * Provides clear academic evidence and flags 'insufficientEvidence' when needed.
 */
function getStudentCareers(student) {
  if (!student) {
    return {
      careers: [],
      insufficientEvidence: true
    };
  }

  // Calculate best careers matching student profile
  const bestCareers = suggestBestCareers(student);

  // Check if student has study evidence
  const scores = student.scores || [];
  const completedScores = scores.filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));

  // If student has no completed scores, mark all careers as insufficient evidence
  const careers = bestCareers.map(c => {
    const isInsufficient = c.insufficientEvidence || completedScores.length === 0;
    return {
      id: c.id,
      careerName: c.careerName,
      matchScore: isInsufficient ? 0 : c.matchScore,
      readinessScore: isInsufficient ? 0 : c.readinessScore,
      score: isInsufficient ? 0 : c.score,
      matchCount: isInsufficient ? 0 : c.matchCount,
      totalRequired: c.totalRequired,
      insufficientEvidence: isInsufficient,
      matchedSkills: isInsufficient ? [] : c.matchedSkills,
      missingSkills: c.missingSkills,
      evidence: isInsufficient ? [] : c.evidence
    };
  });

  const allInsufficient = careers.every(c => c.insufficientEvidence);

  return {
    careers,
    insufficientEvidence: allInsufficient
  };
}

module.exports = {
  getStudentCareers
};
