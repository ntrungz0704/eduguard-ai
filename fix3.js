const fs = require('fs');
const path = 'e:/my-project/eduguard-ai/client/src/pages/StudentSearch.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove proactive banner
const bannerStart = content.indexOf('{/* Proactive Notification Banner */}');
if (bannerStart !== -1) {
  const bannerEnd = content.indexOf('      {/* Detailed Profile & AI Assistant (Full Width) */}');
  if (bannerEnd !== -1) {
    content = content.substring(0, bannerStart) + content.substring(bannerEnd);
  }
}

// 2. Fix getGpaTrend
content = content.replace(
  /const getGpaTrend = \(student\) => \{[\s\S]*?\];\s*\};/m,
  `const getGpaTrend = (student) => {
                  const validScores = (student.scores || []).filter(s => s.value !== null && !isConditionalCourse(s.course?.name || s.courseId, s.courseId));
                  const groupedBySem = {};
                  validScores.forEach(s => {
                    const sem = s.semester || 'Kỳ 1';
                    if (!groupedBySem[sem]) groupedBySem[sem] = { totalPoints: 0, totalCredits: 0 };
                    const credits = getCourseCredits(s.courseId || s.course?.name);
                    groupedBySem[sem].totalPoints += s.value * credits;
                    groupedBySem[sem].totalCredits += credits;
                  });
                  const trend = Object.keys(groupedBySem).sort().map(sem => {
                    const gpa = groupedBySem[sem].totalCredits > 0 ? (groupedBySem[sem].totalPoints / groupedBySem[sem].totalCredits) : 0;
                    return {
                      name: sem,
                      gpa: parseFloat(gpa.toFixed(1)),
                      target: 8.0
                    };
                  });
                  return trend.length > 0 ? trend : [
                    { name: 'Chưa có', gpa: 0, target: 8.0 }
                  ];
                };`
);

// 3. Fix getRadarData
content = content.replace(
  /const getRadarData = \(student\) => \{[\s\S]*?\];\s*\};/m,
  `const getRadarData = (student) => {
                  const validScores = (student.scores || []).filter(s => s.value !== null && !isConditionalCourse(s.course?.name || s.courseId, s.courseId));
                  const recent = validScores.slice(-5);
                  if (recent.length === 0) {
                    return [
                      { subject: 'Chưa có dữ liệu', value: 0, fullMark: 10 }
                    ];
                  }
                  return recent.map(s => ({
                    subject: (s.course?.name || s.courseId).substring(0, 15),
                    value: parseFloat((s.value).toFixed(1)),
                    fullMark: 10
                  }));
                };`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed StudentSearch.jsx');
