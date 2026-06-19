const { calculateOfficialGPA } = require('../../utils/dataService');
const { analyzeBehavior } = require('./behavior-engine');

const SKILL_MATRIX = {
  "COM108": ["Programming Logic", "Variables", "Loops", "C++", "C#"],
  "WEB1013": ["HTML", "CSS", "Responsive", "HTML/CSS", "Web Design"],
  "WEB1043": ["JavaScript", "DOM", "Event"],
  "WEB2063": ["JavaScript", "Async", "Promises", "DOM", "API"],
  "COM2012": ["SQL", "Database"],
  "WEB2014": ["PHP", "Server Side", "MVC"],
  "WEB503": ["NodeJS", "REST API", "Database", "Backend"],
  "WEB2081": ["React", "Component", "State Management", "Frontend"],
  "WEB2091": ["Advanced React", "State Management"],
  "WEB2041": ["CRUD", "Deployment", "Project Planning"],
  "WEB105": ["UIUX", "Figma", "Design Thinking"],
  "WEB1053": ["UIUX", "Figma", "Design Thinking"],
  "WEB2055": ["Marketing", "Analytics"],
  "PRO1014": ["Project Planning", "Teamwork", "Scrum", "Agile", "Deployment"],
  "PRO2201": ["Deployment", "Project Planning", "Fullstack", "Agile", "Teamwork"],
  "MOB1014": ["Java", "Android", "Mobile Development", "Programming Logic"],
  "MOB1023": ["Java", "Object Oriented", "Programming Logic"],
  "MOB201": ["Android", "Mobile Development"],
  "MOB306": ["React Native", "Mobile Development", "JavaScript"],
  "SOF203": ["C#", "Desktop Application", "Programming Logic"],
  "SOF304": ["Software Testing", "Automation", "QA", "Selenium"],
  "NET101": ["Networking", "Cisco", "TCP/IP"],
  "NET102": ["Linux", "Server Management", "System Administration", "Security"]
};

const CAREER_MATRIX = {
  "Frontend Developer": ["HTML", "CSS", "Responsive", "JavaScript", "DOM", "React", "State Management", "UIUX", "Frontend"],
  "Backend Developer": ["Programming Logic", "SQL", "Database", "PHP", "NodeJS", "REST API", "Backend", "MVC", "Server Side"],
  "Fullstack Developer": ["HTML", "CSS", "JavaScript", "SQL", "Database", "PHP", "NodeJS", "React", "Fullstack", "Deployment"],
  "Mobile App Developer": ["Java", "Android", "Mobile Development", "React Native", "JavaScript", "Programming Logic"],
  "Data Analyst": ["SQL", "Database", "Analytics", "Programming Logic", "Variables"],
  "Data Engineer": ["SQL", "Database", "Programming Logic", "Loops"],
  "Data Scientist": ["SQL", "Database", "Programming Logic", "Analytics"],
  "AI/ML Engineer": ["Programming Logic", "Variables", "Loops", "Database"],
  "DevOps Engineer": ["Linux", "Deployment", "Server Management", "Networking"],
  "Cloud Architect": ["Deployment", "Networking", "Server Management", "Linux"],
  "System Administrator": ["Linux", "Server Management", "Networking", "System Administration", "Security"],
  "Network Engineer": ["Networking", "Cisco", "TCP/IP", "Security", "Linux"],
  "QA/Tester (Manual & Automation)": ["Software Testing", "Automation", "QA", "Selenium", "Programming Logic"],
  "UI/UX Designer": ["UIUX", "Figma", "Design Thinking", "HTML", "CSS", "Responsive", "Web Design"],
  "Product Manager": ["Project Planning", "Teamwork", "Agile", "Scrum"],
  "Business Analyst (BA)": ["Project Planning", "SQL", "Database", "Agile", "Scrum", "Teamwork"],
  "Cybersecurity Analyst": ["Security", "Networking", "Linux", "TCP/IP"],
  "Game Developer": ["Programming Logic", "C#", "C++", "Variables"]
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
        const code = s.course?.courseCode || s.courseCode || s.courseId;
        // Keep highest score for retakes
        if (code && (!scoreMap[code] || s.value > scoreMap[code])) {
          scoreMap[code] = s.value;
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

  const coveragePercent = requiredSkills.length > 0 ? (validEvaluatedSkillsCount / requiredSkills.length) * 100 : 0;
  // Only say INSUFFICIENT_DATA if coverage is 0
  if (validEvaluatedSkillsCount === 0) {
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
