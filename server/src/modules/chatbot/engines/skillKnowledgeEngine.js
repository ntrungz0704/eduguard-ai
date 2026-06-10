const fs = require('fs');
const path = require('path');

const encyclopediaPath = path.join(process.cwd(), 'server', 'data', 'knowledge', 'skill_encyclopedia.json');
const dependencyGraphPath = path.join(process.cwd(), 'server', 'data', 'knowledge', 'skill_dependency_graph.json');

let encyclopedia = {};
let dependencyGraph = {};

try {
  encyclopedia = JSON.parse(fs.readFileSync(encyclopediaPath, 'utf8'));
  dependencyGraph = JSON.parse(fs.readFileSync(dependencyGraphPath, 'utf8'));
} catch (e) {
  console.warn('[SkillEngine] Could not load skill knowledge base files.');
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
 * Handles intent: skill.definition
 */
function handleSkillDefinition(skillName) {
  const key = normalizeSkill(skillName);
  if (!key || !encyclopedia[key]) {
    return `Xin lỗi, tôi chưa có thông tin chi tiết về **${skillName}** trong cơ sở dữ liệu. Bạn có thể hỏi về Node.js, React, SQL, Express.js hoặc Next.js nhé.`;
  }
  
  const data = encyclopedia[key];
  return `### 💡 Về ${data.skill}\n\n**Định nghĩa:**\n${data.definition}\n\n**Tại sao nên học?**\n${data.whyLearn}\n\n**Các vị trí công việc thường dùng:**\n${data.usedIn.map(c => `- ${c}`).join('\n')}\n\n**Mức độ khó:** ${data.difficulty} | **Thời gian học:** ${data.learningTime}`;
}

/**
 * Handles intent: skill.prerequisite
 */
function handleSkillPrerequisite(skillName, sessionContext = null) {
  const key = normalizeSkill(skillName);
  if (!key || !encyclopedia[key]) {
    return `Xin lỗi, tôi chưa rõ môn tiên quyết của **${skillName}** là gì.`;
  }

  const data = encyclopedia[key];
  const prereqs = data.prerequisites || [];
  const courses = data.relatedCourses || [];

  let response = `### 📚 Điều kiện tiên quyết để học ${data.skill}\n\n`;
  if (prereqs.length > 0) {
    response += `Để học tốt ${data.skill}, bạn CẦN NẮM VỮNG các kiến thức sau:\n${prereqs.map(p => `- ${p}`).join('\n')}\n\n`;
  } else {
    response += `Tin tốt lành! ${data.skill} là kiến thức nền tảng, bạn có thể bắt đầu học ngay lập tức.\n\n`;
  }

  if (courses.length > 0) {
    response += `Tại FPT Polytechnic, kiến thức này được dạy chủ yếu trong các môn:\n${courses.map(c => `- **${c}**`).join('\n')}\n\n`;
  }

  // If we have student memory, we can check if they passed those courses
  if (sessionContext && sessionContext.completedCourses) {
    const missing = courses.filter(c => !sessionContext.completedCourses.includes(c));
    if (missing.length === 0 && courses.length > 0) {
      response += `> **✅ Đánh giá của AI:** Chúc mừng! Bạn đã pass các môn nền tảng này, bạn HOÀN TOÀN ĐỦ NĂNG LỰC để học ${data.skill} ngay bây giờ.`;
    } else if (missing.length > 0) {
      response += `> **⚠️ Đánh giá của AI:** Hiện tại bạn chưa pass môn ${missing.join(', ')}. Hãy ưu tiên hoàn thành môn học trên trường trước khi tìm hiểu sâu về ${data.skill} nhé.`;
    }
  }

  return response;
}

/**
 * Handles intent: skill.compare
 */
function handleSkillCompare(skill1, skill2) {
  const k1 = normalizeSkill(skill1);
  const k2 = normalizeSkill(skill2);
  
  if (!k1 && !k2) return `Xin lỗi, tôi chưa có đủ dữ liệu để so sánh ${skill1} và ${skill2}.`;
  
  // If we have both, we can check dependency graph
  if (k1 && k2) {
    const deps1 = dependencyGraph[k1] || [];
    const deps2 = dependencyGraph[k2] || [];
    
    if (deps1.includes(k2)) {
      return `### ⚖️ So sánh: ${k1} vs ${k2}\n\n**Bạn BẮT BUỘC PHẢI HỌC ${k2} trước khi học ${k1}**.\nVì ${k2} là nền tảng cốt lõi của ${k1}. Đừng nhảy cóc nhé!`;
    } else if (deps2.includes(k1)) {
      return `### ⚖️ So sánh: ${k1} vs ${k2}\n\n**Bạn BẮT BUỘC PHẢI HỌC ${k1} trước khi học ${k2}**.\nVì ${k1} là nền tảng cốt lõi của ${k2}.`;
    }
    return `### ⚖️ So sánh: ${k1} vs ${k2}\n\nHai công nghệ này phục vụ các mục đích khác nhau. ${k1} có độ khó là **${encyclopedia[k1].difficulty}**, còn ${k2} là **${encyclopedia[k2].difficulty}**.\nBạn có thể học song song hoặc ưu tiên cái nào tùy thuộc vào lộ trình nghề nghiệp của bạn.`;
  }

  return `Tôi chỉ biết thông tin về ${k1 || k2}, chưa đủ dữ liệu cho công nghệ còn lại. Bạn có muốn nghe thông tin về ${k1 || k2} không?`;
}

module.exports = {
  handleSkillDefinition,
  handleSkillPrerequisite,
  handleSkillCompare,
  normalizeSkill
};
