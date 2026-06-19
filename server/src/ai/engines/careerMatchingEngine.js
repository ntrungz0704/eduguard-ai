const SKILL_MATRIX = {
  "WEB3023": ["HTML/CSS", "Responsive Design", "Flexbox", "Grid"],
  "WEB1043": ["JavaScript", "DOM", "ES6"],
  "WEB2063": ["Advanced JavaScript", "Async Await", "Fetch API"],
  "WEB501": ["ECMAScript"],
  "WEB2081": ["React", "Hooks", "State Management"],
  "WEB2091": ["Advanced React"],
  "WEB503": ["NodeJS", "REST API"],
  "WEB108": ["PHP Basic"],
  "WEB2014": ["PHP OOP", "MVC"],
  "COM2012": ["Database", "SQL"],
  "WEB1023": ["Website Administration"],
  "WEB2055": ["Digital Marketing"],
  "WEB105": ["UIUX"],
  "PRO1014": ["Project Management", "CRUD", "Deployment"],
  "PRO2201": ["Capstone Project"]
};

const CAREER_REQUIREMENT_MATRIX = {
  "Frontend Developer": ["HTML/CSS", "Responsive Design", "JavaScript", "ES6", "DOM", "React", "Hooks", "State Management", "UIUX"],
  "Backend Developer": ["PHP", "NodeJS", "REST API", "Database", "SQL", "MVC"],
  "Fullstack Developer": ["HTML/CSS", "JavaScript", "React", "NodeJS", "REST API", "Database", "SQL", "PHP", "MVC"],
  "UIUX Designer": ["UIUX", "HTML/CSS", "Responsive Design"],
  "Web Designer": ["HTML/CSS", "Responsive Design", "UIUX"],
  "Database Developer": ["SQL", "Database"]
};

// Mock semester config to calculate Time Decay Weight
// Current semester is considered 7 (for a max 7 semester program)
// We assume WEB1xx -> sem 1-2, WEB2xx -> sem 3-4, WEB3xx -> sem 4-5, etc.
function estimateSemester(courseCode) {
  if (courseCode.startsWith('WEB1') || courseCode.startsWith('COM1')) return 2;
  if (courseCode.startsWith('WEB2') || courseCode.startsWith('COM2')) return 4;
  if (courseCode.startsWith('WEB3')) return 5;
  if (courseCode.startsWith('WEB5')) return 6;
  if (courseCode.startsWith('PRO1')) return 6;
  if (courseCode.startsWith('PRO2')) return 7;
  return 3;
}

function calculateTimeDecayWeight(courseCode, currentSemester = 7) {
  const courseSem = estimateSemester(courseCode);
  const diff = Math.max(0, currentSemester - courseSem);
  
  // Weight = 1.0 - (0.05 * diff)
  const weight = 1.0 - (0.05 * diff);
  return Math.max(0.75, weight); // Cap at 0.75 for 5+ semesters ago
}

function calculateMatchRate(studentScores, careerName) {
  const requiredSkills = CAREER_REQUIREMENT_MATRIX[careerName];
  if (!requiredSkills) {
    return { missing_data: true };
  }

  // Calculate highest score for each skill across courses
  const studentSkillScores = {};
  const mappedTranscript = [];

  for (const [courseCode, score] of Object.entries(studentScores)) {
    if (score === null || score === undefined) continue;
    const skills = SKILL_MATRIX[courseCode];
    if (skills) {
      const weight = calculateTimeDecayWeight(courseCode);
      const weightedScore = score * weight;
      
      mappedTranscript.push({
        course: courseCode,
        skill: skills,
        score: score,
        weightedScore: Number(weightedScore.toFixed(2))
      });

      skills.forEach(skill => {
        if (!studentSkillScores[skill] || weightedScore > studentSkillScores[skill]) {
          studentSkillScores[skill] = Number(weightedScore.toFixed(2));
        }
      });
    }
  }

  // Calculate Match Rate
  let totalAchieved = 0;
  const maxPossible = requiredSkills.length * 10;

  requiredSkills.forEach(req => {
    if (studentSkillScores[req]) {
      totalAchieved += studentSkillScores[req];
    }
  });

  const matchRate = maxPossible > 0 ? (totalAchieved / maxPossible) * 100 : 0;

  return {
    career_name: careerName,
    backend_match_rate: Number(matchRate.toFixed(1)),
    required_tech_stack: requiredSkills,
    mapped_transcript: mappedTranscript
  };
}

module.exports = {
  SKILL_MATRIX,
  CAREER_REQUIREMENT_MATRIX,
  calculateMatchRate
};
