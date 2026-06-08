// ============================================================
// EduGuard AI — Student Decision Engine
// Copilot engine specifically for students (Motivation, GPA, Planning)
// ============================================================

const { fetchStudentByMssv } = require('../../repositories/studentRepository');
const advisorService = require('../../modules/advisor/service');
const syllabusEngine = require('./syllabusEngine');
const interventionEngine = require('./interventionEngine');
const careerEngine = require('../../modules/advisor/career-engine');
const { explainRisk, generateAcademicTimeline } = require('../../ai/engines/index');
const knowledgeCache = require('../../modules/knowledge/cache');

function getGraphDataForCourse(courseId) {
  const coursesDb = knowledgeCache.get('courses') || [];
  const riskChains = knowledgeCache.get('riskChains') || {};
  
  const code = String(courseId || '').toUpperCase().trim();
  const chain = riskChains[code] || { impacts: [] };
  const impacted = chain.impacts || [];
  
  // Calculate blocked credits
  let blockedCredits = 0;
  impacted.forEach(cCode => {
    const course = coursesDb.find(c => c.courseCode === cCode);
    if (course) {
      blockedCredits += course.credits || 3;
    } else {
      blockedCredits += 3;
    }
  });
  
  // Generate nodes & edges
  const nodes = [{ id: code, label: code, type: 'source' }];
  const edges = [];
  
  impacted.forEach(cCode => {
    nodes.push({ id: cCode, label: cCode, type: 'target' });
    edges.push({ source: code, target: cCode });
  });
  
  return {
    impacted,
    blockedCredits,
    nodes,
    edges
  };
}

async function executeStudentDecision({ intent, activeMssv, entities, session }) {
  const nonLoginIntents = ['STUDENT_CAREER_PATH_INTENT', 'STUDENT_RISK_CHAIN_INTENT', 'STUDENT_GREETING_INTENT', 'STUDENT_BEST_CAREER_INTENT', 'EXPLAIN_MODEL_INTENT'];
  if (!activeMssv && !nonLoginIntents.includes(intent)) {
    return { type: 'NEED_LOGIN' };
  }

  let student = await fetchStudentByMssv(activeMssv);
  
  // Mock student for Demo 
  if (activeMssv && !student && activeMssv === 'SE182001') {
    student = { 
      mssv: 'SE182001', 
      name: 'Nguyễn Văn A',
      scores: [
        { courseId: 'COM108', value: 4.0, status: 'FAILED', attendance: 100 },
        { courseId: 'WEB1013', value: 9.0, status: 'PASSED', attendance: 100 },
        { courseId: 'WEB1043', value: 7.0, status: 'PASSED', attendance: 100 },
        { courseId: 'COM2012', value: 4.0, status: 'FAILED', attendance: 55 },
        { courseId: 'PRO1014', value: 6.0, status: 'PASSED', attendance: 90 }
      ]
    };
  } else if (activeMssv && !student) {
    return { type: 'STUDENT_NOT_FOUND', mssv: activeMssv };
  }

  let riskData = null;
  let timeline = null;
  if (student) {
    const explained = explainRisk(student);
    const criticalFailures = (explained.failedCourses || []).map(c => c.courseId || c);
    const reasons = (explained.explanations || []).map(e => `${e.factor}: ${e.detail}`);
    
    const rawAnalysis = await advisorService.analyzeStudent(student.mssv || activeMssv, "Backend Developer");
    
    riskData = {
      ...rawAnalysis,
      riskLevel: explained.level || rawAnalysis.riskLevel || 'LOW',
      criticalFailures: criticalFailures,
      reasons: reasons.length > 0 ? reasons : ['Không có yếu tố rủi ro đáng kể.']
    };
    
    const timelineArray = generateAcademicTimeline(student, explained);
    timeline = {
      events: timelineArray,
      forecastText: timelineArray.map(t => `- Tuần ${t.week}: ${t.event || t.type}`).join('\n') || 'Tiến độ học tập ổn định.'
    };
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
        riskData,
        timeline
      };

    case 'STUDENT_RISK_INTENT':
      return {
        type: 'STUDENT_RISK',
        student,
        riskData,
        timeline
      };

    case 'STUDENT_RECOMMENDATION_INTENT':
      return {
        type: 'STUDENT_RECOMMENDATION',
        student,
        riskData,
        timeline
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
      if (!courseCode && riskData && riskData.failedCourses && riskData.failedCourses.length > 0) {
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
      const extractedGoal = entities && entities.careerGoal;
      let careerGoal = extractedGoal || (session && session.brain && session.brain.careerGoal) || 'Backend Developer';
      
      // We no longer manually update session here since orchestrator calls updateBrain()

      const careerAnalysis = careerEngine.analyzeCareer(student, careerGoal);
      const bestCareers = careerEngine.suggestBestCareers(student);
      
      let type = 'STUDENT_CAREER_PATH';
      if (intent === 'STUDENT_CAREER_REASON_INTENT') type = 'STUDENT_CAREER_REASON';
      else if (intent === 'STUDENT_INTERNSHIP_PLAN_INTENT') type = 'STUDENT_INTERNSHIP_PLAN';
      else if (intent === 'STUDENT_90_DAY_PLAN_INTENT') type = 'STUDENT_90_DAY_PLAN';

      return { type, careerGoal, careerAnalysis, bestCareers };
    }

    case 'STUDENT_SKILL_GAP_INTENT': {
      const extractedGoal = entities && entities.careerGoal;
      let careerGoal = extractedGoal || (session && session.brain && session.brain.careerGoal) || 'Backend Developer';
      
      const careerAnalysis = careerEngine.analyzeCareer(student, careerGoal);
      return { type: 'STUDENT_SKILL_GAP', careerGoal, careerAnalysis, student };
    }

    case 'STUDENT_PORTFOLIO_INTENT': {
      const extractedGoal = entities && entities.careerGoal;
      let careerGoal = extractedGoal || (session && session.brain && session.brain.careerGoal) || 'Backend Developer';
      
      const careerAnalysis = careerEngine.analyzeCareer(student, careerGoal);
      return { type: 'STUDENT_PORTFOLIO', careerGoal, careerAnalysis, student };
    }

    case 'STUDENT_BEST_CAREER_INTENT': {
      const bestCareers = careerEngine.suggestBestCareers(student);
      return { type: 'STUDENT_BEST_CAREER', bestCareers };
    }

    case 'STUDENT_RISK_CHAIN_INTENT': {
      const targetCourseId = courseCode || 'COM108';
      const graphData = getGraphDataForCourse(targetCourseId);
      return { type: 'STUDENT_RISK_CHAIN', courseId: targetCourseId, graphData };
    }

    case 'STUDENT_TIMELINE_INTENT':
      return {
        type: 'STUDENT_TIMELINE',
        student,
        riskData,
        timeline
      };

    case 'EXPLAIN_MODEL_INTENT':
      return { type: 'EXPLAIN_MODEL' };

    case 'STUDENT_FALLBACK_INTENT':
    default:
      return { type: 'STUDENT_FALLBACK', activeMssv };
  }
}

module.exports = {
  executeStudentDecision
};
