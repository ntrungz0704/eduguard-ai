// ============================================================
// EduGuard AI — Session Memory v3.0 (Student Brain)
// Enhanced session with deep conversation context tracking
// ============================================================

const chatSessions = {};

let cleanupInterval;
if (process.env.NODE_ENV !== 'test') {
  // Clean up expired sessions (older than 30 mins) every 5 minutes
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const timeoutMs = 30 * 60 * 1000;
    for (const [sid, session] of Object.entries(chatSessions)) {
      if (now - session.updatedAt > timeoutMs) {
        console.log(`[SESSION] Expired session auto-cleaned: ${sid}`);
        delete chatSessions[sid];
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
  }
}

function getSession(sessionId, userRole = 'TEACHER') {
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = {
      // Core state
      activeStudent: null,
      activeCourse: null,
      activeClass: null,
      role: userRole,

      // Intent tracking
      lastIntent: 'None',
      intentHistory: [],       // Track last N intents for pattern detection

      // Student context (legacy — kept for backward compat)
      lastRiskAnalysis: null,
      lastSubject: null,
      lastRiskLevel: null,
      lastTopStudents: [],

      // ══════════════════════════════════════════════
      // NEW: Student Brain — Deep Context Engine
      // This is what makes the bot "intelligent"
      // ══════════════════════════════════════════════
      brain: {
        studentId: null,
        careerGoal: null,        // "Frontend Developer" — career the student is exploring
        currentSemester: null,
        gpa: null,
        completedCourses: [],
        failedCourses: [],
        portfolioProjects: [],
        riskLevel: null,

        // v4 Fields (Reasoning Context)
        learningStyle: null,      // "Visual", "Auditory", "Hands-on", "Self-taught"
        strengths: [],            // ["HTML", "CSS", "Programming Logic"]
        weaknesses: [],           // ["JavaScript", "Math"]
        targetInternshipDate: null, // "Spring 2027"
        careerReadiness: null,    // "Foundation"
        academicWarningCount: 0,   // Số lần bị cảnh báo

        lastSkills: [],          // Skills discussed recently (e.g. ["React", "TypeScript"])
        lastCourse: null,        // Course being discussed (e.g. "WEB206")
        lastTopic: null,         // Topic category: "CAREER" | "SKILL_GAP" | "PORTFOLIO" | "ROADMAP" | "RISK" | "90_DAY_PLAN"
        lastRoadmapStep: null,   // Which step in the roadmap was last viewed
        lastProject: null,       // Last project suggestion given
        missingSkills: [],       // Skills identified as gaps
        riskContext: null,       // Last risk analysis result
        academicScore: null,     // Last known academic score
        topCareers: [],          // Top career suggestions computed
      },

      // Conversation history (last 10 turns for context chain)
      conversationHistory: [],

      // Timestamps
      updatedAt: Date.now(),
      createdAt: Date.now()
    };
    console.log(`[SESSION] New session created: ${sessionId}`);
  } else {
    chatSessions[sessionId].updatedAt = Date.now();
    chatSessions[sessionId].role = userRole;
    // Ensure brain exists for older sessions
    if (!chatSessions[sessionId].brain) {
      chatSessions[sessionId].brain = {
        studentId: null, careerGoal: null, currentSemester: null, gpa: null,
        completedCourses: [], failedCourses: [], portfolioProjects: [], riskLevel: null,
        learningStyle: null, strengths: [], weaknesses: [], targetInternshipDate: null,
        careerReadiness: null, academicWarningCount: 0,
        lastSkills: [], lastCourse: null, lastTopic: null, lastRoadmapStep: null,
        lastProject: null, missingSkills: [], riskContext: null, academicScore: null, topCareers: []
      };
    }
  }
  return chatSessions[sessionId];
}

/**
 * Add a conversation turn to session history (max 10)
 */
function addConversationTurn(session, message, intent, activeMssv) {
  if (!session.conversationHistory) session.conversationHistory = [];

  session.conversationHistory.push({
    message,
    intent,
    activeMssv,
    timestamp: Date.now()
  });

  // Keep last 10 turns
  if (session.conversationHistory.length > 10) {
    session.conversationHistory.shift();
  }

  // Track intent history
  if (!session.intentHistory) session.intentHistory = [];
  session.intentHistory.push(intent);
  if (session.intentHistory.length > 5) {
    session.intentHistory.shift();
  }
}

/**
 * Update the Student Brain with context from a decision result.
 * Called by the orchestrator after each student interaction.
 *
 * @param {object} session - The session object
 * @param {string} intent - The resolved intent
 * @param {object} decisionData - The result from executeStudentDecision
 */
function updateBrain(session, intent, decisionData) {
  if (!session.brain) return;
  const brain = session.brain;

  // Career-related intents → remember career goal
  if (decisionData.careerGoal) {
    brain.careerGoal = decisionData.careerGoal;
  }

  // Map intent to topic for follow-up context
  const INTENT_TOPIC_MAP = {
    'STUDENT_CAREER_PATH_INTENT': 'CAREER',
    'STUDENT_SKILL_GAP_INTENT': 'SKILL_GAP',
    'STUDENT_PORTFOLIO_INTENT': 'PORTFOLIO',
    'STUDENT_90_DAY_PLAN_INTENT': '90_DAY_PLAN',
    'STUDENT_ROADMAP_INTENT': 'ROADMAP',
    'STUDENT_RISK_INTENT': 'RISK',
    'STUDENT_OVERVIEW_INTENT': 'OVERVIEW',
    'STUDENT_RECOMMENDATION_INTENT': 'RECOMMENDATION',
    'STUDENT_TIMELINE_INTENT': 'TIMELINE',
    'STUDENT_BEST_CAREER_INTENT': 'BEST_CAREER',
    'STUDENT_INTERNSHIP_PLAN_INTENT': 'INTERNSHIP',
    'STUDENT_CAREER_REASON_INTENT': 'CAREER_REASON',
  };

  if (INTENT_TOPIC_MAP[intent]) {
    brain.lastTopic = INTENT_TOPIC_MAP[intent];
  }

  // Extract and store skill gap info
  if (decisionData.careerAnalysis) {
    const analysis = decisionData.careerAnalysis;
    if (analysis.missingSkills && analysis.missingSkills.length > 0) {
      brain.missingSkills = analysis.missingSkills.slice(0, 10);
    }
    if (analysis.matchedSkills && analysis.matchedSkills.length > 0) {
      brain.lastSkills = analysis.matchedSkills.slice(0, 10);
    }
  }

  // Store risk context
  if (decisionData.riskData) {
    brain.riskContext = {
      level: decisionData.riskData.riskLevel,
      gpa: decisionData.riskData.gpa,
      failedCount: (decisionData.riskData.criticalFailures || []).length
    };
  }

  // Store best career suggestions
  if (decisionData.bestCareers && decisionData.bestCareers.length > 0) {
    brain.topCareers = decisionData.bestCareers.slice(0, 5).map(c => ({
      name: c.career || c.name,
      score: c.matchScore || c.score
    }));
  }

  console.log(`[BRAIN] Updated context: topic=${brain.lastTopic}, career=${brain.careerGoal}, skills=${brain.missingSkills.length} gaps`);
}

module.exports = {
  chatSessions,
  getSession,
  addConversationTurn,
  updateBrain
};
