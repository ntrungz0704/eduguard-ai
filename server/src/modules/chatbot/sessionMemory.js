const chatSessions = {};

// Clean up expired sessions (older than 30 mins) every 5 minutes
setInterval(() => {
  const now = Date.now();
  const timeoutMs = 30 * 60 * 1000;
  for (const [sid, session] of Object.entries(chatSessions)) {
    if (now - session.updatedAt > timeoutMs) {
      console.log(`[SESSION] Expired session auto-cleaned: ${sid}`);
      delete chatSessions[sid];
    }
  }
}, 5 * 60 * 1000);

function getSession(sessionId, userRole = 'TEACHER') {
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = {
      activeStudent: null,
      role: userRole,
      lastIntent: 'None',
      lastSubject: null,
      lastRiskLevel: null,
      lastTopStudents: [],
      updatedAt: Date.now()
    };
    console.log(`[SESSION] New session created: ${sessionId}`);
  } else {
    chatSessions[sessionId].updatedAt = Date.now();
    chatSessions[sessionId].role = userRole;
  }
  return chatSessions[sessionId];
}

module.exports = {
  chatSessions,
  getSession
};
