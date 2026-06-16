const path = require('path');
const fs = require('fs');

let strategiesDb = null;
try {
  const dataPath = path.join(__dirname, '..', 'knowledge', 'data', 'learning_strategies.json');
  if (fs.existsSync(dataPath)) {
    strategiesDb = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[LearningPathGenerator] Could not load learning_strategies.json', e.message);
}

function generatePersonalizedPath(student, targetCourseId, riskLevel, weakSkillsOverride, affectedCLOs) {
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  const duration = isHighRisk ? 4 : 8; // default to 4 weeks for high risk
  
  let roadmap = {
    title: `Lộ trình chuẩn bị cho ${targetCourseId}`,
    duration: duration,
    weeks: []
  };

  let allSkills = [];
  if (strategiesDb && strategiesDb[targetCourseId] && strategiesDb[targetCourseId].skills) {
    allSkills = strategiesDb[targetCourseId].skills;
    roadmap.title = strategiesDb[targetCourseId].title || roadmap.title;
  } else {
    allSkills = ["Kiến thức nền tảng", "Công cụ & Môi trường", "Thực hành cơ bản", "Dự án tổng hợp"];
  }

  let weakSkills = weakSkillsOverride && weakSkillsOverride.length > 0 ? weakSkillsOverride : [];
  if (weakSkills.length === 0) {
    try {
       weakSkills = student.memory?.weaknesses ? JSON.parse(student.memory.weaknesses) : [];
    } catch(e) { }
  }

  const clos = affectedCLOs && affectedCLOs.length > 0 ? affectedCLOs.map(c => c.split(':')[0]) : [];

  // Simple distribution of skills across weeks
  const skillsPerWeek = Math.ceil(allSkills.length / duration);
  
  for (let i = 0; i < duration; i++) {
    const weekSkills = allSkills.slice(i * skillsPerWeek, (i + 1) * skillsPerWeek);
    const tasks = weekSkills.map(skill => `Ôn tập & Thực hành: ${skill}`);
    
    if (i === 0 && weakSkills.length > 0) {
      tasks.unshift(`🎯 Trọng tâm tuần 1: Củng cố nền tảng yếu [${weakSkills.join(', ')}]`);
    }

    if (i === 1 && clos.length > 0) {
      tasks.unshift(`🔍 Rà soát Chuẩn đầu ra (CLOs): ${clos.join(', ')}`);
    }

    roadmap.weeks.push({
      week: i + 1,
      focus: weekSkills.join(', ') || 'Ôn tập tổng hợp',
      tasks: tasks
    });
  }

  return roadmap;
}

module.exports = {
  generatePersonalizedPath
};
