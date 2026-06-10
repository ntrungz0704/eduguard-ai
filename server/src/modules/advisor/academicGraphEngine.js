const fs = require('fs');
const path = require('path');
const knowledgeCache = require('../knowledge/cache');

class AcademicGraphEngine {
  constructor() {
    this.academicRules = this.loadJson('academic_rules.json');
    this.assessments = this.loadJson('assessments.json');
    this.syllabusGraph = this.loadJson('syllabus_graph.json');
    this.learningStrategies = this.loadJson('learning_strategies.json');
    this.careerTransitions = this.loadJson('career_transitions.json');
  }

  loadJson(filename) {
    try {
      const p = path.join(__dirname, '..', '..', '..', 'data', 'knowledge', filename);
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) {
      console.warn(`[AcademicGraphEngine] Failed to load ${filename}:`, e.message);
    }
    return {};
  }

  /**
   * Phân tích ảnh hưởng của một môn học bị nợ/điểm kém đối với mục tiêu nghề nghiệp
   * @param {string} failedCourseCode VD: "COM108"
   * @param {string} targetCareer VD: "Frontend Developer"
   * @returns {object} Reasoning result
   */
  reasonCourseFailure(failedCourseCode, targetCareer) {
    const course = this.syllabusGraph[failedCourseCode.toUpperCase()];
    if (!course) {
      return { 
        hasImpact: false, 
        message: `Hệ thống chưa có thông tin đề cương cho môn ${failedCourseCode}.` 
      };
    }

    const roadmaps = knowledgeCache.get('careerRoadmaps') || {};
    const careerData = roadmaps[targetCareer];
    
    if (!careerData) {
      return {
        hasImpact: false,
        message: `Hệ thống chưa có lộ trình chi tiết cho nghề ${targetCareer}.`
      };
    }

    // 1. Course -> Skills
    const weakSkills = course.core_skills || [];

    // 2. Skills -> Career Requirements (Tìm điểm giao nhau)
    const careerReqs = [...(careerData.coreSkills || []), ...(careerData.advancedSkills || [])].map(s => s.toLowerCase());
    
    const blockedSkills = weakSkills.filter(skill => 
      careerReqs.some(req => req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req))
    );

    // 3. Xây dựng chuỗi suy luận (Reasoning Chain)
    let reasoningChain = [];
    let severity = 'LOW';

    if (blockedSkills.length > 0) {
      severity = 'HIGH';
      reasoningChain.push(`Việc hổng môn ${failedCourseCode} (${course.name}) làm bạn yếu các kỹ năng nền tảng: ${blockedSkills.join(', ')}.`);
      reasoningChain.push(`Những kỹ năng này lại là yêu cầu cốt lõi để làm ${targetCareer}.`);
      
      const strategy = this.learningStrategies[blockedSkills[0]];
      if (strategy) {
        reasoningChain.push(`Khuyến nghị: ${strategy.strategy}`);
      }
    } else {
      // Find downstream unlocked courses that might impact the career
      const unlocks = course.unlocks || [];
      if (unlocks.length > 0) {
        severity = 'MEDIUM';
        reasoningChain.push(`Tuy ${course.name} không liên quan trực tiếp đến ${targetCareer}, nhưng nó là môn chặn của: ${unlocks.join(', ')}.`);
      } else {
        reasoningChain.push(`Môn ${course.name} không ảnh hưởng trực tiếp đến kỹ năng làm ${targetCareer}. Tuy nhiên bạn vẫn cần hoàn thành để xét tốt nghiệp.`);
      }
    }

    // 4. Kiểm tra luật thực tập (Academic Rules)
    const internshipRule = this.academicRules.internship;
    let internshipImpact = null;
    if (internshipRule && internshipRule.prerequisite_courses && internshipRule.prerequisite_courses.includes(failedCourseCode.toUpperCase())) {
      internshipImpact = `CẢNH BÁO: ${failedCourseCode} là môn tiên quyết bắt buộc để được đi Thực tập Doanh nghiệp!`;
    }

    return {
      hasImpact: severity !== 'LOW',
      severity,
      failedCourse: failedCourseCode,
      courseName: course.name,
      targetCareer,
      blockedSkills,
      reasoningChain,
      internshipImpact
    };
  }

  /**
   * Sinh ra báo cáo suy luận tổng hợp dựa trên Student Brain
   * @param {object} brain session.brain
   */
  generateReasoningReport(brain) {
    if (!brain) return null;

    let report = {
      gpaStatus: "OK",
      internshipReady: false,
      criticalWarnings: [],
      reasoning: null
    };

    if (brain.gpa !== null && this.academicRules.internship) {
      if (brain.gpa < this.academicRules.internship.minimum_gpa) {
        report.gpaStatus = "NOT_ELIGIBLE_FOR_INTERNSHIP";
        report.criticalWarnings.push(`GPA hiện tại (${brain.gpa}) thấp hơn mức yêu cầu thực tập (${this.academicRules.internship.minimum_gpa}).`);
      } else {
        report.internshipReady = true;
      }
    }

    if (brain.predictions && brain.predictions.length > 0 && brain.careerGoal) {
      // Tìm các môn dự báo điểm thấp (< 6.5) hoặc Rủi ro cao (HIGH/MEDIUM) sắp học
      const upcomingRisks = brain.predictions
        .filter(p => p.predictedScore < 6.5 || p.risk === 'HIGH')
        .sort((a, b) => a.predictedScore - b.predictedScore);

      if (upcomingRisks.length > 0) {
        const topRisk = upcomingRisks[0];
        const analysis = this.reasonCourseFailure(topRisk.courseId, brain.careerGoal);
        
        // Điều chỉnh lại message cho môn sắp tới (Dự báo) thay vì môn đã rớt
        if (analysis.reasoningChain && analysis.reasoningChain.length > 0) {
          analysis.reasoningChain.unshift(`⚠️ DỰ BÁO KỲ TỚI: Nếu bạn học không tốt môn ${topRisk.courseId} (dự báo điểm: ${topRisk.predictedScore}), bạn sẽ gặp rủi ro dây chuyền sau:`);
        }
        
        report.reasoning = analysis;
      }
    } else if (brain.failedCourses && brain.failedCourses.length > 0 && brain.careerGoal) {
      // Fallback: Lấy môn rớt đầu tiên để phân tích sâu nếu không có dự báo
      const analysis = this.reasonCourseFailure(brain.failedCourses[0], brain.careerGoal);
      report.reasoning = analysis;
    }

    return report;
  }
}

module.exports = new AcademicGraphEngine();
