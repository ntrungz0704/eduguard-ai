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
    affects: ["WEB1013", "PRO1014"],
    careers: ["Software Developer", "Backend Developer"]
  },
  "WEB1013": {
    courseCode: "WEB1013",
    courseName: "Xây dựng trang Web",
    skills: strategiesDb?.WEB1013?.skills || ["Cấu trúc Semantic HTML5", "CSS Selectors", "CSS Flexbox", "CSS Grid cơ bản"],
    affects: ["WEB2063", "WEB108"],
    careers: ["Frontend Developer"]
  },
  "WEB2063": {
    courseCode: "WEB2063",
    courseName: "Lập trình JavaScript nâng cao",
    skills: strategiesDb?.WEB2063?.skills || ["JSX Syntax", "Components (Functional)", "Props và State", "React Hooks (useState, useEffect)"],
    affects: ["PRO2201"],
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
  let impacted = [...(node.affects || [])];
  let result = [];
  
  while(impacted.length > 0) {
    let current = impacted.shift();
    if (!result.includes(current)) {
      result.push(current);
      if (academicGraph[current]) {
        impacted.push(...(academicGraph[current].affects || []));
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
