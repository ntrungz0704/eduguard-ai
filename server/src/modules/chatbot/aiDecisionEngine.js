const { prisma } = require('../../infrastructure/database/prisma');
const { calculateExplainableRisk, generateAcademicTimeline, computeClassAnalytics } = require('../../ai/dssEngine');
const cacheManager = require('../../infrastructure/cache/cacheManager');
const appLogger = require('../../infrastructure/logger');
const eventBus = require('../../events/eventBus');

// Reference to in-memory cache from legacy (training data)
let _legacyCache = null;
function getLegacyCache() {
  if (!_legacyCache) {
    try {
      _legacyCache = require('../../../shared/cache');
    } catch (e) {
      _legacyCache = { trainingData: { students: [] }, uploadedStudents: [] };
    }
  }
  return _legacyCache;
}

// ============================================================
// EduGuard AI — AI Decision Engine
// Orchestrates data fetching + DSS computation for each intent
// ============================================================

/**
 * Fetch a student from Prisma DB or legacy cache by MSSV
 * @param {string} mssv
 * @returns {object|null} Student with scores array
 */
async function fetchStudent(mssv) {
  if (!mssv) return null;

  // Try Prisma first
  try {
    const dbStudent = await prisma.student.findUnique({
      where: { mssv: mssv.toUpperCase() },
      include: { scores: true }
    });
    if (dbStudent) return dbStudent;
  } catch (e) {
    appLogger.warn(`[DSS_ENGINE] Prisma fetch failed for ${mssv}: ${e.message}`);
  }

  // Fallback: legacy memory cache
  const legacy = getLegacyCache();
  const allStudents = [
    ...(legacy.trainingData?.students || []),
    ...(legacy.uploadedStudents || [])
  ];

  const found = allStudents.find(s =>
    (s.id || '').toUpperCase() === mssv.toUpperCase()
  );

  if (!found) return null;

  // Normalize legacy student format to match Prisma format
  return {
    mssv: found.id,
    name: found.name || `Sinh viên ${found.id}`,
    classCode: found.classCode || 'WD18301',
    scores: Object.entries(found.scores || {}).map(([courseId, value]) => ({
      courseId,
      value: value !== null ? parseFloat(value) : null,
      attendance: found.attendance?.[courseId] || null,
      status: value === null ? 'STUDYING' : (parseFloat(value) >= 5 ? 'PASSED' : 'FAILED')
    }))
  };
}

/**
 * Fetch all students for class analytics
 * Merges Prisma DB + legacy cache
 */
async function fetchAllStudents() {
  let students = [];

  try {
    const dbStudents = await prisma.student.findMany({
      include: { scores: true }
    });
    students = dbStudents;
  } catch (e) {
    appLogger.warn(`[DSS_ENGINE] Prisma findMany failed: ${e.message}`);
  }

  // If Prisma is empty, use legacy
  if (students.length === 0) {
    const legacy = getLegacyCache();
    students = (legacy.trainingData?.students || []).map(s => ({
      mssv: s.id,
      name: s.name || `Sinh viên ${s.id}`,
      classCode: s.classCode || 'WD18301',
      scores: Object.entries(s.scores || {}).map(([courseId, value]) => ({
        courseId,
        value: value !== null ? parseFloat(value) : null,
        attendance: null,
        status: value === null ? 'STUDYING' : (parseFloat(value) >= 5 ? 'PASSED' : 'FAILED')
      }))
    }));
  }

  return students;
}

// ============================================================
// Intent Handlers — each returns a structured data object
// ============================================================

async function handleStudentAnalytics(activeMssv) {
  const student = await fetchStudent(activeMssv);
  if (!student) {
    return { type: 'STUDENT_NOT_FOUND', mssv: activeMssv };
  }

  const riskData = calculateExplainableRisk(student);
  const timeline = generateAcademicTimeline(student, riskData);

  // Emit events based on findings
  if (riskData.avgAttendance < 60) {
    eventBus.emitAttendanceWarning(activeMssv, riskData.avgAttendance);
  }
  if (riskData.failedCourses.length > 0) {
    eventBus.emitPrerequisiteBreak(activeMssv, riskData.failedCourses);
  }
  if (riskData.riskScore >= 76) {
    eventBus.emitRiskEscalated(activeMssv, riskData.riskScore, riskData.level);
  }

  return {
    type: 'STUDENT_ANALYTICS',
    student,
    riskData,
    timeline
  };
}

async function handleClassAnalytics() {
  const key = cacheManager.KEYS.CLASS_ANALYTICS;
  return await cacheManager.getOrCompute(key, async () => {
    const students = await fetchAllStudents();
    const analytics = computeClassAnalytics(students);
    return { type: 'CLASS_ANALYTICS', analytics };
  }, cacheManager.TTL.CLASS_ANALYTICS);
}

async function handleRiskRanking() {
  const key = cacheManager.KEYS.RISK_RANKING;
  return await cacheManager.getOrCompute(key, async () => {
    const students = await fetchAllStudents();
    const analytics = computeClassAnalytics(students);
    return {
      type: 'RISK_RANKING',
      topAtRisk: analytics.topAtRisk,
      distribution: analytics.distribution,
      bottleneck: analytics.bottleneckSubjects
    };
  }, cacheManager.TTL.RISK_RANKING);
}

async function handleFollowupIntent(followupType, activeMssv) {
  const student = await fetchStudent(activeMssv);
  if (!student) {
    return { type: 'STUDENT_NOT_FOUND', mssv: activeMssv };
  }

  const riskData = calculateExplainableRisk(student);
  const timeline = generateAcademicTimeline(student, riskData);

  return {
    type: `FOLLOWUP_${followupType}`,
    followupType,
    student,
    riskData,
    timeline
  };
}

// ============================================================
// Main Decision Engine Entry Point
// ============================================================

/**
 * Execute AI decision based on intent and context.
 * @param {object} params
 * @param {string} params.intent - Routed intent string
 * @param {string|null} params.activeMssv - Current active student MSSV
 * @param {object} params.entities - Extracted entities
 * @param {object} params.session - Current session object
 * @returns {Promise<object>} Structured decision data
 */
async function executeDecision({ intent, activeMssv, entities, session }) {
  appLogger.info(`[AI_DECISION] Executing intent: ${intent} | MSSV: ${activeMssv || 'none'}`);

  switch (intent) {
    case 'STUDENT_ANALYTICS_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_MSSV' };
      return await handleStudentAnalytics(mssv);
    }

    case 'CLASS_ANALYTICS_INTENT': {
      const res = await handleClassAnalytics();
      res.topN = entities.topN;
      return res;
    }

    case 'RISK_RANKING_INTENT': {
      const res = await handleRiskRanking();
      res.topN = entities.topN;
      return res;
    }

    case 'FOLLOWUP_ROOT_CAUSE_INTENT':
    case 'FOLLOWUP_ATTENDANCE_INTENT':
    case 'FOLLOWUP_INTERVENTION_INTENT':
    case 'FOLLOWUP_TIMELINE_INTENT':
    case 'FOLLOWUP_STRENGTH_INTENT':
    case 'FOLLOWUP_GPA_DETAIL_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_ACTIVE_STUDENT' };
      const followupType = intent.replace('FOLLOWUP_', '').replace('_INTENT', '');
      return await handleFollowupIntent(followupType, mssv);
    }

    case 'GREETING_INTENT':
      return { type: 'GREETING' };

    case 'GENERAL_SYSTEM_INTENT':
      return { type: 'SYSTEM_INFO' };

    case 'FALLBACK_INTENT':
    default:
      return {
        type: 'FALLBACK',
        hasActiveStudent: !!activeMssv,
        activeMssv
      };
  }
}

module.exports = {
  executeDecision,
  fetchStudent,
  fetchAllStudents
};
