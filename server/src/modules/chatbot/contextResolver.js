const { extractMssv } = require('./entityExtractor');

function resolveContext(req, session) {
  const { message, mssv, studentContext } = req.body;
  const userRole = req.headers['x-user-role'] || 'TEACHER';
  const userId = req.headers['x-user-id'];
  const isStudent = userRole === 'STUDENT';

  let activeMssv = mssv || (studentContext ? (studentContext.mssv || studentContext.id) : null);
  const mssvFromMsg = extractMssv(message);

  if (isStudent && userId) {
    activeMssv = userId.toUpperCase();
  } else if (mssvFromMsg) {
    activeMssv = mssvFromMsg;
  } else {
    activeMssv = session.activeStudent;
  }

  if (activeMssv) {
    activeMssv = extractMssv(activeMssv);
  }

  // Update session active student
  if (activeMssv) {
    session.activeStudent = activeMssv;
    console.log(`[SESSION] Active student updated in context: ${activeMssv}`);
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
