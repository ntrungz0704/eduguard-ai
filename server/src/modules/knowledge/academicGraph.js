const path = require('path');
const fs = require('fs');

// The Academic Graph links: Course -> Skills -> Next Course -> Career
// We'll load the skills from learning_strategies.json if available
let strategiesDb = null;
try {
  const dataPath = path.join(__dirname, 'data', 'learning_strategies.json');
  if (fs.existsSync(dataPath)) {
    strategiesDb = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[AcademicGraph] Could not load learning_strategies.json');
}

const academicGraph = {
  "COM108": {
    courseCode: "COM108",
    courseName: "Nhập môn lập trình",
    skills: strategiesDb?.COM108?.skills || ["Biến và Kiểu dữ liệu", "Câu lệnh điều kiện (if/else)", "Vòng lặp (for, while)", "Hàm và truyền tham số"],
    affects: ["WEB104", "PRO1014"],
    careers: ["Software Developer", "Backend Developer"]
  },
  "WEB104": {
    courseCode: "WEB104",
    courseName: "Xây dựng trang web",
    skills: strategiesDb?.WEB104?.skills || ["Cấu trúc Semantic HTML5", "CSS Selectors", "CSS Flexbox", "CSS Grid cơ bản"],
    affects: ["WEB206", "WEB108"],
    careers: ["Frontend Developer"]
  },
  "WEB206": {
    courseCode: "WEB206",
    courseName: "Lập trình Web Front-End với React",
    skills: strategiesDb?.WEB206?.skills || ["JSX Syntax", "Components (Functional)", "Props và State", "React Hooks (useState, useEffect)"],
    affects: ["DATN"],
    careers: ["Frontend Developer", "Fullstack Developer"]
  }
};

function getDependencies(courseId) {
  return academicGraph[courseId] || null;
}

function traceImpact(courseId) {
  const node = academicGraph[courseId];
  if (!node) return [];

  // BFS or simple array to find impacted courses down the line
  let impacted = [...node.nextCourses];
  let result = [];
  
  while(impacted.length > 0) {
    let current = impacted.shift();
    if (!result.includes(current)) {
      result.push(current);
      if (academicGraph[current]) {
        impacted.push(...academicGraph[current].nextCourses);
      }
    }
  }
  
  return result;
}

module.exports = {
  academicGraph,
  getDependencies,
  traceImpact
};
