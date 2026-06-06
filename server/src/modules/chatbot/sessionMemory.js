// ============================================================
// EduGuard AI — Session Memory v2.0
// Enhanced session graph with conversation history tracking
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
      
      // Student context
      lastRiskAnalysis: null,
      lastSubject: null,
      lastRiskLevel: null,
      lastTopStudents: [],
      
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

module.exports = {
  chatSessions,
  getSession,
  addConversationTurn
};
