const knowledgeCache = require('../knowledge/cache');

exports.generateRecommendations = (graphResults, riskLevel, careerImpact) => {
  const courses = knowledgeCache.get('courses');
  const recommendations = [];

  if (riskLevel === "CRITICAL") {
    recommendations.push({
      priority: 1,
      type: "WARNING",
      message: `Cảnh báo Đỏ: Tiến độ theo đuổi ngành ${careerImpact} đang bị đình trệ nghiêm trọng.`
    });
  } else if (riskLevel === "HIGH") {
    recommendations.push({
      priority: 1,
      type: "WARNING",
      message: `Cảnh báo: Việc rớt môn sẽ ảnh hưởng trực tiếp đến lộ trình ${careerImpact}.`
    });
  }

  graphResults.forEach(r => {
    const code = r.failedCourse;
    recommendations.push({
      priority: 2,
      type: "RETAKE",
      message: `Đăng ký học lại ${code}`
    });
    
    // Skill recommendations
    if (courses) {
      const courseObj = courses.find(c => c.courseCode === code);
      if (courseObj && courseObj.skills && courseObj.skills.length > 0) {
        courseObj.skills.slice(0, 3).forEach(skill => {
          recommendations.push({
            priority: 3,
            type: "SKILL_GAP",
            message: `Ôn tập ${skill}`
          });
        });
      }
    }
  });

  // Sort by priority
  recommendations.sort((a, b) => a.priority - b.priority);

  return recommendations;
};
