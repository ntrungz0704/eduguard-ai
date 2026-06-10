const fs = require('fs');
const path = require('path');
const { prisma } = require('../../../infrastructure/database/prisma');

const encyclopediaPath = path.join(process.cwd(), 'server', 'data', 'knowledge', 'skill_encyclopedia.json');

let encyclopedia = {};

try {
  encyclopedia = JSON.parse(fs.readFileSync(encyclopediaPath, 'utf8'));
} catch (e) {
  console.warn('[RoadmapEngine] Could not load skill knowledge base files.');
}

/**
 * Normalizes user skill input to match DB keys
 */
function normalizeSkill(skill) {
  const s = skill.trim().toLowerCase();
  for (const key of Object.keys(encyclopedia)) {
    if (key.toLowerCase() === s) return key;
  }
  return null;
}

/**
 * Generates a roadmap for a skill
 * If saveToDb is true, it persists it in Prisma (StudentRoadmap -> RoadmapStep)
 */
async function generateSkillRoadmap(studentId, skillName, saveToDb = false) {
  const key = normalizeSkill(skillName);
  if (!key || !encyclopedia[key] || !encyclopedia[key].roadmap) {
    return {
      success: false,
      message: `Xin lỗi, tôi chưa có lộ trình 30 ngày cụ thể cho **${skillName}**. Bổ sung sau nhé!`
    };
  }

  const data = encyclopedia[key];
  const roadmapData = data.roadmap;
  
  let roadmapSteps = [];
  // Parse week1..week4
  for (let i = 1; i <= 4; i++) {
    const wKey = `week${i}`;
    if (roadmapData[wKey]) {
      roadmapSteps.push({
        week: i,
        title: `Tuần ${i}: Khởi động` + (i>2 ? ' nâng cao' : ''),
        description: roadmapData[wKey]
      });
    }
  }

  // Database save logic
  let roadmapId = null;
  if (saveToDb && studentId) {
    try {
      // Create roadmap
      const dbRoadmap = await prisma.studentRoadmap.create({
        data: {
          studentId: studentId,
          skillName: data.skill,
          type: "30_DAYS",
          status: "IN_PROGRESS"
        }
      });
      roadmapId = dbRoadmap.id;

      // Create steps
      for (const step of roadmapSteps) {
        await prisma.roadmapStep.create({
          data: {
            roadmapId: roadmapId,
            week: step.week,
            title: step.title,
            description: step.description,
            status: "TODO"
          }
        });
      }
      
      // Update memory
      const memory = await prisma.studentMemory.findUnique({where: {studentId}});
      if (memory) {
        let savedRoadmaps = [];
        if (memory.completedRoadmaps) {
          try { savedRoadmaps = JSON.parse(memory.completedRoadmaps); } catch(e){}
        }
        if (!savedRoadmaps.includes(roadmapId)) {
          savedRoadmaps.push(roadmapId);
          await prisma.studentMemory.update({
            where: { studentId },
            data: { completedRoadmaps: JSON.stringify(savedRoadmaps) }
          });
        }
      }
    } catch (err) {
      console.error('[ROADMAP ENGINE] Error saving roadmap to DB:', err);
    }
  }

  // Build markdown response
  let response = `### 🗺️ Kế hoạch học tập 30 ngày: ${data.skill}\n\n`;
  response += `Để master ${data.skill}, đây là lộ trình chuẩn bạn nên theo đuổi. `;
  if (roadmapId) {
    response += `*(AI đã lưu lộ trình này vào Hồ sơ học tập của bạn)*\n\n`;
  } else {
    response += `\n\n`;
  }

  for (const step of roadmapSteps) {
    response += `**📅 Tuần ${step.week}:**\n- ${step.description}\n\n`;
  }

  if (data.projects && data.projects.length > 0) {
    response += `**🎯 Dự án cuối khóa (Portfolio):**\n${data.projects.map(p => `- ${p}`).join('\n')}\n\n`;
  }
  
  if (data.resources && data.resources.length > 0) {
    response += `**🔗 Nguồn tài liệu khuyên dùng:**\n${data.resources.map(r => `- ${r}`).join('\n')}\n\n`;
  }

  return {
    success: true,
    message: response,
    roadmapId: roadmapId
  };
}

module.exports = {
  generateSkillRoadmap,
  normalizeSkill
};
