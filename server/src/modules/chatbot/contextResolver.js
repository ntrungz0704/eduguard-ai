const { extractMssv, detectListPosition } = require('./entityExtractor');

/**
 * Context Resolver v2.0 — Smart context switching with MSSV priority
 * 
 * Rules:
 * 1. If new MSSV detected in message → switch to new student (context switching)
 * 2. If list position reference ("đứa đầu tiên") → resolve from lastTopStudents
 * 3. If contextual pronoun ("nó", "em đó") → keep active student
 * 4. If follow-up intent with no new entity → keep active student
 * 5. Never reset activeStudent on unrelated queries
 */
function resolveContext(req, session) {
  const { message, mssv, studentContext } = req.body;
  const userRole = req.user?.role || req.headers['x-user-role'] || 'TEACHER';
  const userId = req.user?.id || req.headers['x-user-id'];
  const isStudent = userRole === 'STUDENT';
  
  const msgLower = (message || '').toLowerCase().trim();

  // ── Priority 1: Student mode → always use their own ID
  if (isStudent && userId) {
    const activeMssv = userId.toUpperCase();
    session.activeStudent = activeMssv;
    return { activeMssv, isStudent, userId, userRole };
  }

  // ── Priority 2: Explicit MSSV from request body
  let activeMssv = mssv || (studentContext ? (studentContext.mssv || studentContext.id) : null);

  // ── Priority 3: Extract MSSV from natural language (strongest signal)
  const mssvFromMsg = extractMssv(message);
  if (mssvFromMsg) {
    // New MSSV detected → CONTEXT SWITCH
    activeMssv = mssvFromMsg;
    session.activeStudent = activeMssv;
    console.log(`[CONTEXT] Context switch to new student: ${activeMssv}`);
    return { activeMssv, isStudent, userId, userRole };
  }

  // ── Priority 4: List position reference ("đứa đầu tiên", "thứ hai")
  const listPos = detectListPosition(msgLower);
  if (listPos !== null && session.lastTopStudents && session.lastTopStudents.length > 0) {
    let resolvedIndex;
    if (listPos === -1) {
      // "cuối cùng"
      resolvedIndex = session.lastTopStudents.length - 1;
    } else {
      resolvedIndex = listPos;
    }

    if (resolvedIndex >= 0 && resolvedIndex < session.lastTopStudents.length) {
      activeMssv = session.lastTopStudents[resolvedIndex];
      session.activeStudent = activeMssv;
      console.log(`[CONTEXT] Resolved list position ${listPos} → ${activeMssv}`);
      return { activeMssv, isStudent, userId, userRole };
    }
  }

  // ── Priority 5: Contextual pronouns ("nó", "em đó", "sinh viên này")
  const contextualPhrases = [
    "em đó", "bạn đó", "sinh viên này", "em này", "bạn này", 
    "sinh viên đó", "đứa đó", "đứa này", "cu cậu", "cô bé", "cậu bé", 
    "nhỏ này", "thằng này", "nó", "của nó", "cho nó", "nó thì", "nó có",
    "học lực sv đó", "attendance của nó", "attendance của em đó", 
    "chuyên cần của nó", "chuyên cần của em đó", "em đó sao", "nó sao",
    "đứa đó thế nào", "em này ra sao", "bạn này thế nào"
  ];
  const hasContextualStudent = contextualPhrases.some(phrase => msgLower.includes(phrase));

  if (hasContextualStudent && session.activeStudent) {
    activeMssv = session.activeStudent;
    console.log(`[CONTEXT] Contextual pronoun → keeping active student: ${activeMssv}`);
    return { activeMssv, isStudent, userId, userRole };
  }

  // ── Priority 6: Preserve active student for follow-up intents
  // Don't reset activeStudent just because a new query doesn't mention a student
  if (!activeMssv && session.activeStudent) {
    activeMssv = session.activeStudent;
  }

  // Normalize activeMssv if it exists
  if (activeMssv) {
    const normalized = extractMssv(activeMssv);
    if (normalized) activeMssv = normalized;
    session.activeStudent = activeMssv;
    console.log(`[CONTEXT] Active student maintained: ${activeMssv}`);
  }

  return {
    activeMssv,
    isStudent,
    userId,
    userRole
  };
}

module.exports = {
  resolveContext
};
