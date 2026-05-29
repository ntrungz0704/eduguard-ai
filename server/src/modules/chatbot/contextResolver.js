const { extractMssv } = require('./entityExtractor');

function resolveContext(req, session) {
  const { message, mssv, studentContext } = req.body;
  const userRole = req.headers['x-user-role'] || 'TEACHER';
  const userId = req.headers['x-user-id'];
  const isStudent = userRole === 'STUDENT';
  
  const msgLower = (message || '').toLowerCase().trim();

  let activeMssv = mssv || (studentContext ? (studentContext.mssv || studentContext.id) : null);
  const mssvFromMsg = extractMssv(message);

  const contextualPhrases = [
    "em đó", "bạn đó", "sinh viên này", "em này", "bạn này", 
    "sinh viên đó", "đứa đó", "đứa này", "cu cậu", "cô bé", "cậu bé", "nhỏ này", "thằng này", "nó",
    "học lực sv đó", "attendance của nó", "attendance của em đó", "chuyên cần của nó", "chuyên cần của em đó"
  ];
  const hasContextualStudent = contextualPhrases.some(phrase => msgLower.includes(phrase));

  if (isStudent && userId) {
    activeMssv = userId.toUpperCase();
  } else if (mssvFromMsg) {
    activeMssv = mssvFromMsg;
  } else if (session.lastTopStudents && session.lastTopStudents.length > 0 && 
             /(?:đầu tiên|thứ nhất|đầu|số 1|thứ 1|người đầu|thằng đầu|sv đầu|em đầu|đứa đầu|thứ hai|thứ 2|số 2|bạn thứ hai|đứa thứ hai|em thứ hai|sv thứ hai|thứ ba|thứ 3|số 3|bạn thứ ba|đứa thứ ba|em thứ ba|sv thứ ba|cuối cùng|cuối|sv cuối|em cuối|đứa cuối)/.test(msgLower)) {
    // List position matching takes priority over generic active student context
    if (/(?:đầu tiên|thứ nhất|đứa đầu|thằng đầu|bạn đầu|số 1|thứ 1|người đầu|sv đầu|em đầu)/.test(msgLower)) {
      activeMssv = session.lastTopStudents[0];
    } else if (/(?:thứ hai|thứ 2|số 2|bạn thứ hai|đứa thứ hai|em thứ hai|sv thứ hai)/.test(msgLower) && session.lastTopStudents.length > 1) {
      activeMssv = session.lastTopStudents[1];
    } else if (/(?:thứ ba|thứ 3|số 3|bạn thứ ba|đứa thứ ba|em thứ ba|sv thứ ba)/.test(msgLower) && session.lastTopStudents.length > 2) {
      activeMssv = session.lastTopStudents[2];
    } else if (/(?:cuối cùng|cuối|sv cuối|em cuối|đứa cuối)/.test(msgLower)) {
      activeMssv = session.lastTopStudents[session.lastTopStudents.length - 1];
    } else {
      activeMssv = session.activeStudent;
    }
  } else if (hasContextualStudent && session.activeStudent) {
    activeMssv = session.activeStudent;
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

