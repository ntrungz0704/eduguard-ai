// ============================================================
// EduGuard AI — Student Decision Engine
// Copilot engine specifically for students (Motivation, GPA, Planning)
// ============================================================

const { fetchStudentByMssv } = require('../../repositories/studentRepository');
const advisorService = require('../../modules/advisor/service');
const syllabusEngine = require('./syllabusEngine');
const interventionEngine = require('./interventionEngine');
const careerEngine = require('../../modules/advisor/career-engine');

async function executeStudentDecision({ intent, activeMssv, entities, session }) {
  const nonLoginIntents = ['STUDENT_CAREER_PATH_INTENT', 'STUDENT_RISK_CHAIN_INTENT', 'STUDENT_GREETING_INTENT', 'STUDENT_BEST_CAREER_INTENT'];
  if (!activeMssv && !nonLoginIntents.includes(intent)) {
    return { type: 'NEED_LOGIN' };
  }

  let student = await fetchStudentByMssv(activeMssv);
  
  // Mock student for Demo 
  if (activeMssv && !student && activeMssv === 'SE182001') {
    student = { 
      mssv: 'SE182001', 
      name: 'Nguyễn Văn A',
      scores: {
        'COM108': 8.5,
        'WEB1013': 9.0,
        'WEB1043': 7.0, // Passed some frontend stuff
        'COM2012': 4.0, // Failed DB
        'PRO1014': 6.0
      }
    };
  } else if (activeMssv && !student) {
    return { type: 'STUDENT_NOT_FOUND', mssv: activeMssv };
  }

  let riskData = null;
  if (activeMssv) {
    riskData = await advisorService.analyzeStudent(activeMssv, "Backend Developer");
  }
  
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

    case 'STUDENT_CAREER_PATH_INTENT':
    case 'STUDENT_CAREER_REASON_INTENT':
    case 'STUDENT_INTERNSHIP_PLAN_INTENT':
    case 'STUDENT_90_DAY_PLAN_INTENT': {
      let careerGoal = (entities && entities.careerGoal) ? entities.careerGoal : 'Backend Developer';
      // Normalize common names
      const lower = careerGoal.toLowerCase();
      if (lower.includes('backend') || lower.includes('back-end')) careerGoal = 'Backend Developer';
      else if (lower.includes('frontend') || lower.includes('front-end')) careerGoal = 'Frontend Developer';
      else if (lower.includes('fullstack')) careerGoal = 'Fullstack Developer';
      else if (lower.includes('flutter') || lower.includes('dart')) careerGoal = 'Flutter Developer';
      else if (lower.includes('react native') || lower.includes('mobile')) careerGoal = 'React Native Developer';
      else if (lower.includes('qa') || lower.includes('tester') || lower.includes('manual')) careerGoal = 'QA Manual';
      else if (lower.includes('automation')) careerGoal = 'QA Automation';
      else if (lower.includes('devops')) careerGoal = 'DevOps Engineer';
      else if (lower.includes('cloud')) careerGoal = 'Cloud Engineer';
      else if (lower.includes('data analyst')) careerGoal = 'Data Analyst';
      else if (lower.includes('data engineer')) careerGoal = 'Data Engineer';
      else if (lower.includes('ai') || lower.includes('machine learning')) careerGoal = 'AI Engineer';
      else if (lower.includes('prompt')) careerGoal = 'Prompt Engineer';
      else if (lower.includes('security')) careerGoal = 'Web Security Engineer';
      else if (lower.includes('ux') || lower.includes('ui') || lower.includes('design')) careerGoal = 'UI/UX Designer';
      else if (lower.includes('product owner') || lower.includes('po')) careerGoal = 'Product Owner';
      else if (lower.includes('project manager') || lower.includes('pm')) careerGoal = 'Project Manager';
      else if (lower.includes('wordpress') || lower.includes('cms')) careerGoal = 'WordPress Developer';

      const careerAnalysis = careerEngine.analyzeCareer(student, careerGoal);
      const bestCareers = careerEngine.suggestBestCareers(student);
      
      let type = 'STUDENT_CAREER_PATH';
      if (intent === 'STUDENT_CAREER_REASON_INTENT') type = 'STUDENT_CAREER_REASON';
      else if (intent === 'STUDENT_INTERNSHIP_PLAN_INTENT') type = 'STUDENT_INTERNSHIP_PLAN';
      else if (intent === 'STUDENT_90_DAY_PLAN_INTENT') type = 'STUDENT_90_DAY_PLAN';

      return { type, careerGoal, careerAnalysis, bestCareers };
    }

    case 'STUDENT_BEST_CAREER_INTENT': {
      const bestCareers = careerEngine.suggestBestCareers(student);
      return { type: 'STUDENT_BEST_CAREER', bestCareers };
    }

    case 'STUDENT_RISK_CHAIN_INTENT': {
      const targetCourseId = courseCode || 'COM108';
      return { type: 'STUDENT_RISK_CHAIN', courseId: targetCourseId };
    }

    case 'STUDENT_FALLBACK_INTENT':
    default:
      return { type: 'STUDENT_FALLBACK', activeMssv };
  }
}

module.exports = {
  executeStudentDecision
};
