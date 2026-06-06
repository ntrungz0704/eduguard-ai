const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, '..', '..', '..', 'data', 'knowledge');

const cache = {
  courses: null,
  graph: null,
  riskChains: null,
  careerPaths: null,
  summary: null,
  centrality: null,
  learningDomains: null,
  careerRoadmaps: null
};

const fileMap = {
  courses: 'courses.json',
  graph: 'graph.json',
  riskChains: 'risk-chains.json',
  careerPaths: 'career-paths.json',
  summary: 'knowledge-summary.json',
  centrality: 'course-centrality.json',
  learningDomains: 'learning-domains.json',
  careerRoadmaps: 'career-roadmaps.json'
};

exports.init = () => {
  for (const [key, filename] of Object.entries(fileMap)) {
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    if (fs.existsSync(filePath)) {
      cache[key] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  }
  console.log("📚 Knowledge Cache loaded successfully in RAM.");
};

exports.get = (key) => {
  return cache[key];
};
