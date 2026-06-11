const { academicGraph } = require('../knowledge/academicGraph');

function calculateSkillGap(studentScore, courseId) {
  // If studentScore >= 7.0, no gap. If lower, calculate gap.
  // The lower the score, the more skills they are missing.
  // For a sophisticated DSS, we return a targeted array of missing skills.
  
  if (studentScore >= 7.0) {
    return {
      course: courseId,
      missingSkills: []
    };
  }

  const courseData = academicGraph[courseId];
  const allSkills = courseData ? courseData.skills : ["Kiến thức cơ bản", "Thực hành ứng dụng"];

  let missingCount = 0;
  if (studentScore < 4.0) missingCount = allSkills.length;
  else if (studentScore < 5.0) missingCount = Math.max(1, allSkills.length - 1);
  else if (studentScore < 6.0) missingCount = Math.max(1, Math.floor(allSkills.length / 2));
  else missingCount = 1;

  // For simplicity in DSS, we just assume they miss the hardest skills or front-end skills.
  // Let's just return the top N missing skills.
  return {
    course: courseId,
    missingSkills: allSkills.slice(0, missingCount)
  };
}

module.exports = {
  calculateSkillGap
};
