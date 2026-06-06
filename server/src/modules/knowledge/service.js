const cache = require('./cache');
const { fetchStudentByMssv } = require('../../repositories/studentRepository');
const { analyzeCareer } = require('../advisor/career-engine');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const CATEGORY_MAP = {
  'Frontend Developer': 'Web Development',
  'React Developer': 'Web Development',
  'Next.js Developer': 'Web Development',
  'Backend Developer': 'Web Development',
  'Fullstack Developer': 'Web Development',
  'Software Engineer': 'Web Development',
  'UI Engineer': 'Web Development',
  'Mobile Developer': 'Mobile',
  'Flutter Developer': 'Mobile',
  'React Native Developer': 'Mobile',
  'QA Automation Engineer': 'QA & Testing',
  'DevOps Junior Engineer': 'DevOps & Cloud',
  'Cloud Engineer': 'DevOps & Cloud',
  'WordPress Developer': 'CMS',
  'AI Frontend Engineer': 'AI & Emerging Tech',
  'AI Fullstack Engineer': 'AI & Emerging Tech',
  'Technical Support Engineer': 'Other',
  'Solutions Engineer': 'Other'
};

exports.getCourse = (code) => {
  const courses = cache.get('courses');
  if (!courses) throw new Error("Knowledge cache not loaded");
  
  const course = courses.find(c => c.courseCode === code.toUpperCase());
  if (!course) return null;

  const centrality = cache.get('centrality');
  if (centrality && centrality[course.courseCode]) {
    course.centrality = centrality[course.courseCode];
  }
  return course;
};

exports.getRiskChain = (code) => {
  const riskChains = cache.get('riskChains');
  if (!riskChains) throw new Error("Knowledge cache not loaded");
  return riskChains[code.toUpperCase()] || null;
};

exports.getCareerPath = (path) => {
  const careerPaths = cache.get('careerPaths');
  if (!careerPaths) throw new Error("Knowledge cache not loaded");
  
  const key = Object.keys(careerPaths).find(k => k.toLowerCase() === path.toLowerCase());
  if (!key) return null;
  return { career: key, courses: careerPaths[key] };
};

exports.getSummary = () => {
  const summary = cache.get('summary');
  if (!summary) throw new Error("Knowledge cache not loaded");
  return summary;
};

exports.getAllCareers = async (mssv) => {
  const roadmaps = cache.get('careerRoadmaps');
  if (!roadmaps) throw new Error("Knowledge cache not loaded");

  let student = null;
  if (mssv) {
    try {
      student = await fetchStudentByMssv(mssv);
    } catch (e) {
      console.warn("Could not load student for career matching:", e);
    }
  }

  return Object.entries(roadmaps).map(([key, data]) => {
    let readinessScore = 0;
    if (student) {
      try {
        const analysis = analyzeCareer(student, key);
        readinessScore = analysis.readinessScore || 0;
      } catch (e) {
        console.warn(`Analysis failed for ${key}:`, e);
      }
    }

    return {
      id: slugify(key),
      careerName: data.careerName || key,
      description: data.description || '',
      salaryRange: data.salaryRange || 'N/A',
      marketDemand: data.marketDemand || 'N/A',
      futureTrend: data.futureTrend || 'N/A',
      coreSkills: data.coreSkills || [],
      advancedSkills: data.advancedSkills || [],
      tools: data.tools || [],
      softSkills: data.softSkills || [],
      portfolios: data.portfolios || [],
      category: CATEGORY_MAP[key] || 'Other',
      readinessScore
    };
  });
};

exports.analyzeStudentCareer = async (goalSlug, mssv) => {
  const roadmaps = cache.get('careerRoadmaps');
  if (!roadmaps) throw new Error("Knowledge cache not loaded");

  const careerKey = Object.keys(roadmaps).find(k => slugify(k) === goalSlug);
  if (!careerKey) return null;

  const student = await fetchStudentByMssv(mssv);
  if (!student) return null;

  return analyzeCareer(student, careerKey);
};
