const fs = require('fs');
const path = 'e:/my-project/eduguard-ai/client/src/pages/StudentSearch.jsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /const getRadarData = \(student\) => \{[\s\S]*?\];\s*\};/m,
  `const getRadarData = (student) => {
                  const validScores = (student.scores || []).filter(s => s.value !== null && !isConditionalCourse(s.course?.name || s.courseId, s.courseId));
                  const recent = validScores.slice(-5);
                  if (recent.length === 0) {
                    return [
                      { subject: 'Chưa có', value: 0, fullMark: 10 }
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
