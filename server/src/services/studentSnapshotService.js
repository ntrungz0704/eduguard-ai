const riskService = require('./riskService');
const analyticsService = require('./analyticsService');

// Simple in-memory cache for academic snapshots
const snapshotCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  
  const studentId = studentObj.mssv || studentObj.id;
  const now = Date.now();
  
  // Check if we have a valid cached snapshot
  const cached = snapshotCache.get(studentId);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.snapshot;
  }

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

  const snapshot = {
    studentId: studentId,
    name: studentObj.name,
    classCode: studentObj.classCode,
    gpa10: studentAnalytics.gpa10,
    gpa4: studentAnalytics.gpa4,
    credits: studentAnalytics.totalEarnedCredits,
    totalCredits: studentAnalytics.totalEarnedCredits, // alias to prevent undefined
    failedCourses: failedCoursesIds,
    failedCoursesCount: failedCoursesIds.length,
    academicHealth: Math.max(0, 100 - baseRiskObj.riskScore),
    riskScore: baseRiskObj.riskScore,
    riskLevel: baseRiskObj.riskLevel,
    rootCauseCourses: rootCauseCourses,
    totalScoresCount: studentAnalytics.totalScoresCount,
    curriculumSemesterStats: studentAnalytics.curriculumSemesterStats
  };

  // Cache the generated snapshot
  snapshotCache.set(studentId, {
    snapshot,
    timestamp: now
  });

  return snapshot;
}

/**
 * Clears the snapshot cache (either for a specific student or the entire cache).
 * @param {string|null} studentId 
 */
function clearSnapshotCache(studentId = null) {
  if (studentId) {
    snapshotCache.delete(studentId);
  } else {
    snapshotCache.clear();
  }
}

module.exports = {
  buildAcademicSnapshot,
  clearSnapshotCache
};
