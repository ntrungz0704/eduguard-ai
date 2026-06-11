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

function generatePersonalizedPath(student, targetCourseId, riskLevel) {
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  const duration = isHighRisk ? 4 : 8; // default to 4 weeks for high risk
  
  let roadmap = {
    title: `Lộ trình cải thiện ${targetCourseId}`,
    duration: duration,
    weeks: []
  };

  let allSkills = [];
  if (strategiesDb && strategiesDb[targetCourseId] && strategiesDb[targetCourseId].skills) {
    allSkills = strategiesDb[targetCourseId].skills;
    roadmap.title = strategiesDb[targetCourseId].title || roadmap.title;
  } else {
    allSkills = ["Kiến thức nền tảng 1", "Kiến thức nền tảng 2", "Thực hành cơ bản", "Dự án tổng hợp"];
  }

  // Parse weaknesses from student memory if available, else empty
  let weakSkills = [];
  try {
     weakSkills = student.memory?.weaknesses ? JSON.parse(student.memory.weaknesses) : [];
  } catch(e) { }

  // Simple distribution of skills across weeks
  const skillsPerWeek = Math.ceil(allSkills.length / duration);
  
  for (let i = 0; i < duration; i++) {
    const weekSkills = allSkills.slice(i * skillsPerWeek, (i + 1) * skillsPerWeek);
    const tasks = weekSkills.map(skill => `Ôn tập & Thực hành: ${skill}`);
    
    if (i === 0 && weakSkills.length > 0) {
      tasks.unshift(`🎯 Trọng tâm: Xử lý lỗ hổng [${weakSkills.join(', ')}]`);
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
