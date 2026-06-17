const riskService = require('./riskService');
const analyticsService = require('./analyticsService');

/**
 * studentSnapshotService
 * Provides a Single Source of Truth (SSOT) for a student's core academic metrics.
 * This MUST be used by all endpoints (Student Profile, Dashboard, Red Alerts, Chatbot, PDF).
 */

/**
 * Builds the standard Academic Snapshot DTO.
 * @param {Object} studentObj - The full student object including scores, predictions, interventions.
 * @returns {Object} academicSnapshot
 */
function buildAcademicSnapshot(studentObj) {
  if (!studentObj) return null;

  // Unify Risk & Priority Level using central services
  const baseRiskObj = riskService.getStudentRisk(studentObj);
  const studentAnalytics = analyticsService.getStudentAnalytics(studentObj);

  // Identify failed courses (excluding those that have been resolved)
  const failedCoursesIds = (studentObj.scores || [])
    .filter(sc => sc.value !== null && sc.value < 5.0 && sc.status !== 'PASSED')
    .map(sc => sc.courseId);

  // Provide a simple root cause extraction (could be expanded by the DSS logic if needed)
  // For the SSOT baseline, we list failed courses as potential root causes
  const rootCauseCourses = failedCoursesIds;

  return {
    studentId: studentObj.mssv || studentObj.id,
    name: studentObj.name,
    classCode: studentObj.classCode,
    gpa10: studentAnalytics.gpa10,
    gpa4: studentAnalytics.gpa4,
    credits: studentAnalytics.totalEarnedCredits,
    failedCourses: failedCoursesIds,
    academicHealth: Math.max(0, 100 - baseRiskObj.riskScore),
    riskScore: baseRiskObj.riskScore,
    riskLevel: baseRiskObj.riskLevel,
    rootCauseCourses: rootCauseCourses,
    totalScoresCount: studentAnalytics.totalScoresCount,
    curriculumSemesterStats: studentAnalytics.curriculumSemesterStats
  };
}

module.exports = {
  buildAcademicSnapshot
};
