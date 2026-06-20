const cache = require('./cache');
const { fetchStudentByMssv } = require('../../repositories/studentRepository');
const { analyzeCareer, suggestBestCareers } = require('../advisor/career-engine');
const { prisma } = require('../../infrastructure/database/prisma');
const readinessService = require('../learning/readinessService');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const CATEGORY_MAP = {
  'Frontend Developer': 'Web Development',
  'React Developer': 'Web Development',
  'Next.js Developer': 'Web Development',
  'Backend Developer': 'Web Development',
  'Node.js Developer': 'Web Development',
  'Full Stack Developer': 'Web Development',
  'Software Engineer': 'Web Development',
  'UI Engineer': 'Web Development',
  'Flutter Developer': 'Mobile Development',
  'React Native Developer': 'Mobile Development',
  'QA Automation Engineer': 'QA & Testing',
  'DevOps Engineer': 'Cloud & DevOps',
  'Cloud Engineer': 'Cloud & DevOps',
  'AI Frontend Engineer': 'AI & Emerging',
  'AI Fullstack Engineer': 'AI & Emerging',
  'Prompt Engineer': 'AI & Emerging',
  'Software Architect': 'Architecture',
  'Solutions Engineer': 'Support'
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

exports.getDependencies = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../../../data/knowledge/course_dependency.json');
    const raw = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading course_dependency.json:", err);
    return {};
  }
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
  let allBoards = [];
  let dbStudent = null;

  if (mssv) {
    try {
      student = await fetchStudentByMssv(mssv);
      allBoards = await prisma.learningBoard.findMany({
        where: { studentId: mssv },
        include: { tasks: true }
      });
      dbStudent = await prisma.student.findUnique({
        where: { mssv },
        include: { scores: { include: { course: true } } }
      });
    } catch (e) {
      console.warn("Could not load student for career matching:", e);
    }
  }

  const results = await Promise.all(Object.entries(roadmaps).map(async ([key, data]) => {
    let readinessScore = 0;
    const isAiFullstack = key === 'AI Fullstack Engineer';
    const careerId = isAiFullstack ? 'ai-engineer' : slugify(key);
    let insufficientEvidence = false;
    let matchedSkills = [];
    let missingSkills = [];
    let evidence = [];

    if (student) {
      try {
        const analysis = analyzeCareer(student, key);
        insufficientEvidence = analysis.insufficientEvidence;
        matchedSkills = analysis.matchedSkills;
        missingSkills = analysis.missingSkills;
        evidence = analysis.evidence;

        const board = allBoards.find(b => b.careerId === careerId);

        if (board) {
          // If a Learning Board exists, calculate real metrics from DB
          const realMetrics = await readinessService.calculateCareerReadiness(mssv, careerId, board.tasks, student);
          readinessScore = realMetrics.readinessScore;
          if (readinessScore > 0) {
            insufficientEvidence = false;
          }
        } else {
          // Otherwise, simulate based on academic mapping
          readinessScore = analysis.readinessScore || 0;
        }
      } catch (e) {
        console.warn(`Analysis failed for ${key}:`, e);
      }
    }

    return {
      id: careerId,
      careerName: isAiFullstack ? 'AI Engineer' : (data.careerName || key),
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
      readinessScore,
      roadmap: data.roadmap || [],
      insufficientEvidence,
      matchedSkills,
      missingSkills,
      evidence
    };
  }));
  return results;
};

exports.analyzeStudentCareer = async (goalSlug, mssv) => {
  const roadmaps = cache.get('careerRoadmaps');
  if (!roadmaps) throw new Error("Knowledge cache not loaded");

  const careerKey = Object.keys(roadmaps).find(k => {
    const slug = slugify(k);
    if (slug === goalSlug) return true;
    if (goalSlug === 'ai-engineer' && slug === 'ai-fullstack-engineer') return true;
    return false;
  });
  if (!careerKey) return null;

  const student = await fetchStudentByMssv(mssv);
  if (!student) return null;

  return analyzeCareer(student, careerKey);
};

exports.suggestCareers = async (mssv) => {
  // Use getAllCareers to ensure 100% synchronization of scores across the entire system, 
  // including LearningBoard adjustments if they exist.
  const allCareers = await exports.getAllCareers(mssv);
  
  const results = allCareers.map(c => ({
    id: c.id,
    careerName: c.careerName,
    matchScore: c.readinessScore || 0,
    readinessScore: c.readinessScore || 0,
    score: c.readinessScore || 0,
    matchCount: c.matchedSkills ? c.matchedSkills.length : 0,
    totalRequired: (c.coreSkills ? c.coreSkills.length : 0) + (c.advancedSkills ? c.advancedSkills.length : 0),
    insufficientEvidence: c.insufficientEvidence,
    matchedSkills: c.matchedSkills,
    missingSkills: c.missingSkills,
    evidence: c.evidence
  }));

  results.sort((a, b) => b.score - a.score);
  return results;
};
