// ============================================================
// EduGuard AI — Student Decision Engine
// Copilot engine specifically for students (Motivation, GPA, Planning)
// ============================================================

const { fetchStudent } = require('./aiDecisionEngine');
const { calculateExplainableRisk } = require('../../ai/dssEngine');
const syllabusEngine = require('./syllabusEngine');
const interventionEngine = require('./interventionEngine');

async function executeStudentDecision({ intent, activeMssv, entities, session }) {
  if (!activeMssv) {
    return { type: 'NEED_LOGIN' };
  }

  const student = await fetchStudent(activeMssv);
  if (!student) {
    return { type: 'STUDENT_NOT_FOUND', mssv: activeMssv };
  }

  const riskData = calculateExplainableRisk(student);
  
  // Resolve courseCode from entities (e.g. %WEB101%) or session history
  let courseCode = null;
  if (entities && entities.subject) {
    courseCode = entities.subject.toUpperCase();
    session.lastSubject = courseCode;
  } else if (session && session.lastSubject) {
    courseCode = session.lastSubject;
  }

  switch (intent) {
    case 'STUDENT_OVERVIEW_INTENT':
    case 'STUDENT_PROGRESS_INTENT':
      return {
        type: 'STUDENT_OVERVIEW',
        student,
        riskData
      };

    case 'STUDENT_RISK_INTENT':
      return {
        type: 'STUDENT_RISK',
        student,
        riskData
      };

    case 'STUDENT_RECOMMENDATION_INTENT':
      return {
        type: 'STUDENT_RECOMMENDATION',
        student,
        riskData
      };

    case 'STUDENT_MOTIVATION_INTENT':
      return {
        type: 'STUDENT_MOTIVATION',
        student,
        riskData
      };

    case 'STUDENT_GPA_SIMULATION_INTENT':
      return {
        type: 'STUDENT_GPA_SIMULATION',
        student,
        riskData
      };

    case 'STUDENT_GREETING_INTENT':
      return { type: 'STUDENT_GREETING' };

    case 'STUDENT_SYLLABUS_INFO_INTENT':
      if (courseCode) {
        const course = syllabusEngine.getCourseDetails(courseCode);
        const text = syllabusEngine.formatCourseInfoResponse(course);
        return { type: 'STUDENT_SYLLABUS_INFO', text, student };
      }
      return { type: 'STUDENT_SYLLABUS_INFO', text: "Bạn muốn xem nội dung của môn học nào? Vui lòng cung cấp mã môn (VD: WEB101).", student };
    
    case 'STUDENT_SYLLABUS_PREREQ_INTENT':
      if (courseCode) {
        const course = syllabusEngine.getCourseDetails(courseCode);
        const prereqs = syllabusEngine.getPrerequisites(courseCode);
        const text = syllabusEngine.formatPrerequisiteResponse(course, prereqs);
        return { type: 'STUDENT_SYLLABUS_PREREQ', text, student };
      }
      return { type: 'STUDENT_SYLLABUS_PREREQ', text: "Bạn muốn xem điều kiện tiên quyết của môn nào? Vui lòng cung cấp mã môn.", student };
      
    case 'STUDENT_INTERVENTION_REASON_INTENT':
      if (!courseCode && riskData.failedCourses && riskData.failedCourses.length > 0) {
        courseCode = riskData.failedCourses[0].courseId;
      }
      if (courseCode) {
        const text = interventionEngine.generatePersonalizedIntervention(student.id, courseCode, riskData.failedCourses?.find(c => c.courseId === courseCode)?.value || 4.0, student);
        return { type: 'STUDENT_INTERVENTION_REASON', text, student, riskData };
      }
      return { type: 'STUDENT_INTERVENTION_REASON', text: "Bạn không có môn học nào bị cảnh báo rủi ro cao.", student, riskData };
      
    case 'STUDENT_ROADMAP_INTENT':
      return { 
        type: 'STUDENT_ROADMAP', 
        text: "Dựa vào lộ trình, kỳ tới bạn nên đăng ký các môn tiếp nối của kỳ hiện tại. Bạn có thể tra cứu chi tiết Syllabus để biết môn học nào được mở khóa (Ví dụ: hỏi 'WEB201 cần học môn gì trước').", 
        student, 
        riskData 
      };

    case 'STUDENT_FALLBACK_INTENT':
    default:
      return { type: 'STUDENT_FALLBACK', activeMssv };
  }
}

module.exports = {
  executeStudentDecision
};
