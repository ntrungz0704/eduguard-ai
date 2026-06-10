const fs = require('fs');
const path = require('path');

// Load Knowledge Base
const skillsData = require('../../data/knowledge/skills.json');
const skillDependencies = require('../../data/knowledge/skill_dependencies.json');
const techDictionary = require('../../data/knowledge/technology_dictionary.json');

/**
 * Normalizes a skill name based on dictionary
 */
function normalizeSkillName(rawName) {
  const lower = rawName.toLowerCase().trim();
  return techDictionary[lower] || null;
}

/**
 * Extract all known skills from user input
 */
function extractSkills(message) {
  const words = message.toLowerCase().split(/[\s,?.!]+/).filter(Boolean);
  const foundSkills = new Set();
  
  // Checking single and compound words based on the dictionary keys
  for (const key of Object.keys(techDictionary)) {
    if (message.toLowerCase().includes(key)) {
      foundSkills.add(techDictionary[key]);
    }
  }
  
  return Array.from(foundSkills);
}

/**
 * Evaluate readiness based on prerequisites and completed courses
 */
function evaluateReadiness(skillKey, brain) {
  const skill = skillsData[skillKey];
  if (!skill) return { ready: false, reason: "Skill not found." };
  
  const completedCourses = brain.completedCourses || [];
  const gpa = brain.gpa || 0;
  
  // Check if they passed related courses
  const passedRelated = skill.relatedCourses.filter(c => completedCourses.includes(c));
  
  if (passedRelated.length > 0) {
    return {
      ready: true,
      reason: `Bạn đã học tốt ${passedRelated.join(", ")}. Điều này cho thấy bạn đã có nền tảng. Sẵn sàng học ${skillKey}.`
    };
  } else if (skill.requiredSkills && skill.requiredSkills.length > 0) {
    // Check knownSkills
    const knownSkills = brain.knownSkills || [];
    const missing = skill.requiredSkills.filter(s => !knownSkills.includes(s));
    
    if (missing.length === 0) {
      return {
        ready: true,
        reason: `Bạn đã có nền tảng về ${skill.requiredSkills.join(", ")}. Rất thích hợp để bắt đầu ${skillKey}.`
      };
    } else {
      return {
        ready: false,
        reason: `Bạn cần tìm hiểu thêm về ${missing.join(", ")} trước khi bắt đầu ${skillKey}.`
      };
    }
  }
  
  return {
    ready: true,
    reason: `Bạn có thể bắt đầu học ${skillKey} ngay bây giờ.`
  };
}

/**
 * Main engine processing
 */
function processSkillQuery(message, session) {
  const skills = extractSkills(message);
  
  if (skills.length === 0) return null;
  
  // Take the first detected skill for the main response
  const targetSkill = skills[0];
  const skillInfo = skillsData[targetSkill];
  
  if (!skillInfo) return null;
  
  // Evaluate readiness
  const readiness = evaluateReadiness(targetSkill, session.brain);
  
  // Construct Markdown Response
  let response = `### 🚀 Phân tích Kỹ năng: ${targetSkill}\n\n`;
  
  response += `**Định nghĩa:** ${skillInfo.description}\n\n`;
  response += `**Mục đích sử dụng:** ${skillInfo.purpose}\n\n`;
  
  response += `#### 📋 Yêu cầu (Prerequisites):\n`;
  skillInfo.requiredSkills.forEach(req => {
    response += `- ${req}\n`;
  });
  response += `\n`;
  
  response += `#### 🎓 Môn học liên quan tại FPT:\n`;
  response += `${skillInfo.relatedCourses.join(", ")}\n\n`;
  
  response += `#### 💼 Nghề nghiệp sử dụng:\n`;
  skillInfo.careers.forEach(c => {
    response += `- ${c}\n`;
  });
  response += `\n`;
  
  response += `#### ⏱ Lộ trình & Thời gian học (Ước tính: ${skillInfo.learningTime}):\n`;
  response += `Độ khó: ${"⭐".repeat(skillInfo.difficulty)}${"☆".repeat(5 - skillInfo.difficulty)}\n`;
  if (skillInfo.portfolioProjects && skillInfo.portfolioProjects.length > 0) {
    response += `**Dự án gợi ý:**\n`;
    skillInfo.portfolioProjects.forEach(p => {
      response += `- ${p}\n`;
    });
  }
  response += `\n`;
  
  response += `#### 🤖 Đánh giá độ sẵn sàng của bạn:\n`;
  response += `**Phân tích học lực:** ${readiness.reason}\n\n`;
  
  if (readiness.ready) {
    response += `=> **Đề xuất:** Bạn hoàn toàn có thể bắt đầu tìm hiểu ${targetSkill} từ bây giờ.`;
  } else {
    response += `=> **Đề xuất:** Hãy dành thời gian ôn lại nền tảng trước nhé.`;
  }
  
  // Track in memory
  if (!session.brain.interestedSkills) session.brain.interestedSkills = [];
  if (!session.brain.interestedSkills.includes(targetSkill)) {
    session.brain.interestedSkills.push(targetSkill);
  }
  if (!session.brain.recentTopics) session.brain.recentTopics = [];
  session.brain.recentTopics.push(`Hỏi về ${targetSkill}`);
  if (session.brain.recentTopics.length > 5) session.brain.recentTopics.shift();
  
  return response;
}

module.exports = {
  processSkillQuery,
  extractSkills
};
