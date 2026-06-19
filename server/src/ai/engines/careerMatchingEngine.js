const SKILL_MATRIX = {
  "WEB3023": ["HTML/CSS", "Responsive Design", "Flexbox", "Grid"],
  "WEB1013": ["HTML/CSS", "Responsive Design", "Flexbox", "Grid", "UIUX", "HTML", "CSS"],
  "WEB1043": ["JavaScript", "DOM", "ES6"],
  "WEB2063": ["Advanced JavaScript", "Async Await", "Fetch API", "DOM"],
  "WEB501": ["ECMAScript"],
  "WEB5013": ["ECMAScript"],
  "WEB2081": ["React", "Hooks", "State Management"],
  "WEB2091": ["Advanced React", "State Management"],
  "WEB503": ["NodeJS", "REST API", "Database", "SQL"],
  "WEB108": ["PHP Basic", "PHP"],
  "WEB2014": ["PHP OOP", "MVC", "PHP"],
  "COM2012": ["Database", "SQL"],
  "WEB1023": ["Website Administration"],
  "WEB1022": ["Website Administration"],
  "WEB2055": ["Digital Marketing", "Marketing", "Analytics"],
  "WEB2053": ["Digital Marketing", "Marketing"],
  "WEB105": ["UIUX", "Design Thinking", "Figma"],
  "WEB1053": ["UIUX", "Design Thinking", "Figma"],
  "PRO1014": ["Project Management", "CRUD", "Deployment", "Teamwork"],
  "PRO2201": ["Capstone Project", "Fullstack", "Deployment"],
  "COM108": ["Programming Logic", "Variables", "Loops"]
};

const CAREER_REQUIREMENT_MATRIX = {
  "Frontend Developer": ["HTML/CSS", "Responsive Design", "JavaScript", "ES6", "DOM", "React", "Hooks", "State Management", "UIUX", "HTML", "CSS"],
  "Backend Developer": ["PHP", "NodeJS", "REST API", "Database", "SQL", "MVC", "Programming Logic"],
  "Fullstack Developer": ["HTML/CSS", "JavaScript", "React", "NodeJS", "REST API", "Database", "SQL", "PHP", "MVC", "HTML", "CSS", "Deployment"],
  "Mobile App Developer": ["JavaScript", "React", "Programming Logic", "State Management", "Database", "API", "Mobile Development", "Android", "Swift", "Kotlin"],
  "Data Analyst": ["Database", "SQL", "Analytics", "Programming Logic", "Data Analysis", "Python", "Excel"],
  "Data Engineer": ["Database", "SQL", "Programming Logic", "Big Data", "Pipeline", "Python"],
  "Data Scientist": ["Database", "SQL", "Analytics", "Programming Logic", "Machine Learning", "Python", "Statistics"],
  "AI/ML Engineer": ["Programming Logic", "Database", "Python", "Machine Learning", "Deep Learning", "Algorithms"],
  "DevOps Engineer": ["Deployment", "Website Administration", "Linux", "Cloud", "Docker", "CI/CD", "AWS"],
  "Cloud Architect": ["Deployment", "Website Administration", "Cloud", "AWS", "Azure", "Networking", "Infrastructure"],
  "System Administrator": ["Website Administration", "Deployment", "Linux", "Networking", "Server Management"],
  "Network Engineer": ["Website Administration", "Networking", "Cisco", "TCP/IP", "Security"],
  "QA/Tester (Manual & Automation)": ["Programming Logic", "Software Testing", "Automation", "Selenium", "Bug Tracking"],
  "UI/UX Designer": ["UIUX", "Design Thinking", "Figma", "HTML/CSS", "HTML", "CSS", "Responsive Design"],
  "Product Manager": ["Project Management", "Teamwork", "Agile", "Scrum", "Business"],
  "Business Analyst (BA)": ["Project Management", "Database", "SQL", "UML", "Business Requirements", "Agile"],
  "Cybersecurity Analyst": ["Website Administration", "Programming Logic", "Security", "Networking", "Cryptography"],
  "Game Developer": ["Programming Logic", "Unity", "C#", "C++", "Game Design", "3D"]
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
