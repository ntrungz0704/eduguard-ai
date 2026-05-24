const { extractMssv } = require('./entityExtractor');

function resolveContext(req, session) {
  const { message, mssv, studentContext } = req.body;
  const userRole = req.headers['x-user-role'] || 'TEACHER';
  const userId = req.headers['x-user-id'];
  const isStudent = userRole === 'STUDENT';
  
  const msgLower = (message || '').toLowerCase();

  let activeMssv = mssv || (studentContext ? (studentContext.mssv || studentContext.id) : null);
  const mssvFromMsg = extractMssv(message);

  if (isStudent && userId) {
    activeMssv = userId.toUpperCase();
  } else if (mssvFromMsg) {
    activeMssv = mssvFromMsg;
  } else if (session.lastTopStudents && session.lastTopStudents.length > 0) {
    // Contextual Follow-up for lists
    if (/(?:đứa đầu|thằng đầu|bạn đầu|số 1|thứ 1|người đầu)/.test(msgLower)) {
      activeMssv = session.lastTopStudents[0];
    } else if (/(?:đứa thứ hai|bạn thứ hai|số 2|thứ 2)/.test(msgLower) && session.lastTopStudents.length > 1) {
      activeMssv = session.lastTopStudents[1];
    } else if (/(?:đứa thứ ba|bạn thứ ba|số 3|thứ 3)/.test(msgLower) && session.lastTopStudents.length > 2) {
      activeMssv = session.lastTopStudents[2];
    } else {
      activeMssv = session.activeStudent;
    }
  } else {
    activeMssv = session.activeStudent;
  }

  if (activeMssv) {
    activeMssv = extractMssv(activeMssv) || activeMssv;
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

