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

  const careers = bestCareers.map(c => {
    return {
      id: c.id,
      careerName: c.careerName,
      matchScore: c.matchScore,
      readinessScore: c.readinessScore,
      score: c.score,
      matchCount: c.matchCount,
      totalRequired: c.totalRequired,
      insufficientEvidence: false,
      matchedSkills: c.matchedSkills,
      missingSkills: c.missingSkills,
      evidence: c.evidence
    };
  });

  return {
    careers,
    insufficientEvidence: false
  };
}

module.exports = {
  getStudentCareers
};
