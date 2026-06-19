const { calculateOfficialGPA } = require('../../utils/dataService');
const { analyzeBehavior } = require('./behavior-engine');

const SKILL_MATRIX = {
  "WEB1013": ["HTML", "CSS", "Responsive"],
  "WEB1043": ["JavaScript", "DOM", "Event"],
  "COM2012": ["SQL", "Database"],
  "WEB2014": ["PHP", "Server Side"],
  "WEB503": ["NodeJS", "REST API"],
  "WEB2081": ["React", "Component"],
  "WEB2091": ["Advanced React", "State Management"],
  "WEB2041": ["CRUD", "Deployment", "Project Planning"],
  "WEB105": ["UIUX"]
};

const CAREER_MATRIX = {
  "Frontend Developer": ["HTML", "CSS", "Responsive", "JavaScript", "DOM", "React", "State Management"],
  "Backend Developer": ["Programming Logic", "SQL", "Database", "PHP", "NodeJS", "REST API"],
  "Fullstack Developer": ["HTML", "CSS", "JavaScript", "SQL", "Database", "PHP", "NodeJS", "React"],
  "UIUX Designer": ["UIUX", "Figma", "Design Thinking"],
  "SEO / Wordpress": ["Marketing", "Analytics", "Wordpress"]
};

function slugify(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function evaluateSkillScore(score) {
  if (score === null || score === undefined) return 'UNKNOWN';
  if (score >= 8) return 'MASTERED';
  if (score >= 6.5) return 'GOOD';
  if (score >= 5.0) return 'WEAK';
  return 'CRITICAL';
}

function evaluateSkillPercentage(score) {
  if (score === null || score === undefined) return 0;
  if (score >= 8) return 100;
  if (score >= 6.5) return 80;
  if (score >= 5.0) return 60;
  return 0; // critical
}

exports.analyzeCareer = (student, careerGoal) => {
  const mode = (student && student.mssv) ? 'STUDENT' : 'GUEST';
  
  // Find real career mapping
  const careerKey = Object.keys(CAREER_MATRIX).find(k => k.toLowerCase() === (careerGoal || '').toLowerCase());
  const requiredSkills = careerKey ? CAREER_MATRIX[careerKey] : [];

  if (!careerKey || requiredSkills.length === 0) {
    return { insufficientEvidence: true };
  }

  // 1. Gather all student real scores
  const scoreMap = {};
  if (student && student.scores) {
    student.scores.forEach(s => {
      if (s.value !== null) {
        // Keep highest score for retakes
        if (!scoreMap[s.courseCode] || s.value > scoreMap[s.courseCode]) {
          scoreMap[s.courseCode] = s.value;
        }
      }
    });
  }

  // 2. Map Scores -> Skills
  const studentSkills = {};
  Object.keys(scoreMap).forEach(courseCode => {
    const courseScore = scoreMap[courseCode];
    if (SKILL_MATRIX[courseCode]) {
      SKILL_MATRIX[courseCode].forEach(skill => {
        // If multiple courses teach the same skill, take the max
        if (studentSkills[skill] === undefined || courseScore > studentSkills[skill].score) {
          studentSkills[skill] = {
            score: courseScore,
            status: evaluateSkillScore(courseScore),
            sourceCourse: courseCode
          };
        }
      });
    }
  });

  // 3. Evaluate Career Match against Required Skills
  let matchedCount = 0;
  let totalScorePercentage = 0;
  const matchedSkills = [];
  const missingSkills = [];
  const evidence = [];
  const validEvaluatedSkillsCount = requiredSkills.filter(req => studentSkills[req] !== undefined).length;

  requiredSkills.forEach(req => {
    const studentSkill = studentSkills[req];
    if (studentSkill) {
      matchedCount++;
      totalScorePercentage += evaluateSkillPercentage(studentSkill.score);
      matchedSkills.push({
        skill: req,
        score: studentSkill.score,
        status: studentSkill.status,
        sourceCourse: studentSkill.sourceCourse
      });
      evidence.push({
        courseId: studentSkill.sourceCourse,
        courseName: studentSkill.sourceCourse,
        skills: [req]
      });
    } else {
      missingSkills.push({
        skill: req,
        score: null,
        status: 'UNKNOWN',
        sourceCourse: null
      });
    }
  });

  // Strict Rule: If < 50% of the required skills have actual data -> INSUFFICIENT_DATA
  const coveragePercent = requiredSkills.length > 0 ? (validEvaluatedSkillsCount / requiredSkills.length) * 100 : 0;
  
  if (coveragePercent < 50) {
    return {
      insufficientEvidence: true,
      careerGoal: careerKey,
      coveragePercent
    };
  }

  // Strict Math Average
  const readinessScore = validEvaluatedSkillsCount > 0 
    ? Math.round(totalScorePercentage / requiredSkills.length) // Notice divided by REQUIRED, not just Evaluated, so UNKNOWN penalizes
    : 0;

  return {
    mode,
    careerGoal: careerKey,
    progressPercent: coveragePercent,
    readinessScore: readinessScore, // this acts as the final % match (e.g. 75%)
    matchedSkills,
    missingSkills,
    evidence,
    insufficientEvidence: false,
    skillGap: {
      core: { have: matchedSkills.map(m => m.skill), missing: missingSkills.map(m => m.skill) },
      advanced: { have: [], missing: [] }
    },
    industryRequirements: {
      core: requiredSkills,
      advanced: [],
      tools: [],
      soft: []
    }
  };
};

exports.suggestBestCareers = (student) => {
  if (!student) return [];
  const results = [];
  
  for (const careerGoal of Object.keys(CAREER_MATRIX)) {
    const analysis = exports.analyzeCareer(student, careerGoal);
    
    results.push({
      id: slugify(careerGoal),
      careerName: careerGoal,
      matchScore: analysis.readinessScore || 0,
      readinessScore: analysis.readinessScore || 0,
      score: analysis.readinessScore || 0,
      matchCount: analysis.matchedSkills ? analysis.matchedSkills.length : 0,
      totalRequired: CAREER_MATRIX[careerGoal].length,
      insufficientEvidence: analysis.insufficientEvidence,
      matchedSkills: analysis.matchedSkills || [],
      missingSkills: analysis.missingSkills || [],
      evidence: analysis.evidence || []
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results; 
};

exports.analyzeStudentCareer = async (goalSlug, mssv) => {
  // Mock function, not heavily used directly in this iteration but kept for API compat
  return null;
};

exports.SKILL_MATRIX = SKILL_MATRIX;
exports.CAREER_MATRIX = CAREER_MATRIX;
exports.evaluateSkillScore = evaluateSkillScore;
