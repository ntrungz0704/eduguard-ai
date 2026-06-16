const { prisma } = require('../../infrastructure/database/prisma');
const { generatePersonalizedPath } = require('./learningPathGenerator');
const { traceImpact } = require('../knowledge/academicGraph');
const { calculateSkillGap } = require('./skillGapEngine');

async function sendAutomatedRoadmap(studentId, targetCourseId, riskLevel, studentData, missingSkillsArr, affectedCLOs) {
  try {
    // Predict score or fallback
    const predictedScore = studentData.predictedScore || 4.2; 
    
    // Skill Gap Analysis (Layer 2)
    let weakSkillsInfo = calculateSkillGap(predictedScore, targetCourseId);
    let weakSkills = missingSkillsArr && missingSkillsArr.length > 0 ? missingSkillsArr : weakSkillsInfo.missingSkills;
    if (weakSkills.length === 0) {
      try {
         weakSkills = studentData.memory?.weaknesses ? JSON.parse(studentData.memory.weaknesses) : [];
      } catch(e) { }
    }
    const weaknessStr = weakSkills.length > 0 
      ? weakSkills.map(s => `- Thiếu ${s}`).join('\n') 
      : '- Thiếu kiến thức cơ bản';

    // 1. Generate roadmap
    const roadmap = generatePersonalizedPath(studentData, targetCourseId, riskLevel, weakSkills, affectedCLOs);

    // Academic Graph Impact (Layer 1)
    const impactedCourses = traceImpact(targetCourseId);
    let impactStr = targetCourseId;
    if (impactedCourses.length > 0) {
      impactStr += '\n↓\n' + impactedCourses.join('\n↓\n');
    }

    // Roadmap formatting
    let roadmapText = '';
    roadmap.weeks.forEach(w => {
      roadmapText += `\nTuần ${w.week}:\n${w.focus}\n`;
    });

    const detailedMessage = `🎯 AI Academic Advisor

Sinh viên:
${studentId}

Môn nguy cơ:
${targetCourseId}

Điểm dự báo:
${predictedScore}

Nguyên nhân:
${weaknessStr}

Ảnh hưởng:
${impactStr}

Kế hoạch ${roadmap.duration} tuần:
${roadmapText}
Mục tiêu:
≥ 7.0`;

    // 2. Save to database (Layer 3)
    const interventionRoadmap = await prisma.interventionRoadmap.create({
      data: {
        studentId: studentId,
        targetCourseId,
        riskLevel: riskLevel,
        riskReason: 'Nguy cơ rớt môn dựa trên dự báo',
        affectedCourses: JSON.stringify(impactedCourses),
        missingSkills: JSON.stringify(weakSkills),
        roadmap: JSON.stringify(roadmap),
        sentDate: new Date()
      }
    });

    // 3. Create a Message in inbox so it appears for the student and teacher
    const message = await prisma.message.create({
      data: {
        senderId: 'SYSTEM',
        receiverId: studentId,
        content: detailedMessage,
        isRead: false
      }
    });

    return {
      success: true,
      roadmapId: interventionRoadmap.id,
      roadmap: roadmap,
      messageId: message.id
    };
  } catch (error) {
    console.error('[InterventionEngine] Error sending automated roadmap:', error);
    throw error;
  }
}

async function getStudentRoadmaps(studentId) {
  return await prisma.interventionRoadmap.findMany({
    where: { studentId: studentId },
    orderBy: { sentDate: 'desc' }
  });
}

module.exports = {
  sendAutomatedRoadmap,
  getStudentRoadmaps
};
