const fs = require('fs');
const path = require('path');

const processedJsonDir = path.join(__dirname, '..', 'data', 'processed-json');
const dependencyFile = path.join(__dirname, '..', 'data', 'course_dependency.json');
const knowledgeDir = path.join(__dirname, '..', 'data', 'knowledge');

// Ensure knowledge dir exists
if (!fs.existsSync(knowledgeDir)) {
  fs.mkdirSync(knowledgeDir, { recursive: true });
}

// Dictionaries
const TECH_KEYWORDS = {
  "JavaScript": ["javascript", "js", "ecmascript"],
  "React": ["react", "reactjs", "react.js"],
  "NodeJS": ["nodejs", "node.js", "expressjs", "express.js"],
  "MongoDB": ["mongodb", "nosql"],
  "MySQL": ["mysql", "sql server", "rdbms"],
  "SQL": ["sql"],
  "HTML": ["html", "html5"],
  "CSS": ["css", "css3", "bootstrap", "tailwind"],
  "Java": ["java", "jsp", "servlet", "spring"],
  "C": ["language c", "c programming", "ngôn ngữ c", "cfree", "c free"],
  "C#": ["c#", "csharp", ".net", "asp.net"],
  "Git": ["git", "github"],
  "Docker": ["docker"],
  "BOM/DOM": ["bom", "dom"]
};

const SKILL_KEYWORDS = {
  "Programming Logic": ["logic", "algorithm", "thuật toán", "cấu trúc dữ liệu", "điều kiện", "vòng lặp", "condition", "loop", "variable", "biến"],
  "Object-Oriented Programming": ["oop", "object oriented", "hướng đối tượng"],
  "Database Design": ["database", "erd", "cơ sở dữ liệu", "thiết kế csdl"],
  "Frontend Development": ["frontend", "ui", "giao diện", "web design"],
  "Backend Development": ["backend", "api", "restful", "web service", "máy chủ"],
  "Soft Skills": ["kỹ năng mềm", "thuyết trình", "làm việc nhóm", "teamwork", "presentation", "giao tiếp", "communication"],
  "Project Management": ["quản lý dự án", "agile", "scrum", "quản trị dự án"],
  "System Architecture": ["architecture", "kiến trúc phần mềm", "mvc", "thiết kế hệ thống"]
};

// Dynamic Career Paths Config
const CAREER_REQUIREMENTS = {
  "Frontend Developer": ["Frontend Development", "JavaScript", "HTML", "CSS", "React", "BOM/DOM"],
  "Backend Developer": ["Backend Development", "Database Design", "NodeJS", "Java", "SQL", "MySQL"],
  "Fullstack Developer": ["Frontend Development", "Backend Development", "JavaScript", "Database Design", "System Architecture", "NodeJS"],
  "Software Engineer": ["Programming Logic", "Object-Oriented Programming", "System Architecture", "Project Management"],
  "IT Business Analyst": ["Soft Skills", "Project Management", "System Architecture", "Database Design"]
};

// Learning Domains Map
const DOMAIN_MAPPING = {
  "Programming": { keywords: ["Programming Logic", "Object-Oriented Programming", "C", "Java", "C#"] },
  "Frontend": { keywords: ["Frontend Development", "HTML", "CSS", "JavaScript", "React", "BOM/DOM"] },
  "Backend": { keywords: ["Backend Development", "NodeJS", "Java", "API", "System Architecture"] },
  "Database": { keywords: ["Database Design", "SQL", "MySQL", "MongoDB"] },
  "Soft Skills": { keywords: ["Soft Skills", "Project Management"] }
};

// Normalize course code
function normalizeCourseCode(code) {
  if (!code) return '';
  code = code.trim().toUpperCase();
  const match = code.match(/^([A-Z]{3}\d{3})\d$/);
  if (match) {
    return match[1];
  }
  return code;
}

// 1. loadSyllabuses()
function loadSyllabuses() {
  const files = fs.readdirSync(processedJsonDir).filter(f => f.endsWith('.json'));
  const courses = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(processedJsonDir, f), 'utf-8');
    try {
      const data = JSON.parse(raw);
      courses.push(data);
    } catch(e) {
      console.error('Error parsing', f);
    }
  }
  return courses;
}

// 2. extract functions
function extractKeywords(text, dictionary) {
  const found = new Set();
  const lowerText = text.toLowerCase();
  for (const [key, variants] of Object.entries(dictionary)) {
    for (const variant of variants) {
      if (lowerText.includes(variant.toLowerCase())) {
        found.add(key);
        break;
      }
    }
  }
  return Array.from(found);
}

function extractFromCourse(course) {
  // Combine all texts
  let textToScan = (course.description || '') + ' ';
  if (course.learning_outcomes) {
    textToScan += course.learning_outcomes.map(o => o.title + ' ' + o.details).join(' ');
  }
  if (course.sessions) {
    textToScan += course.sessions.map(s => s.topic + ' ' + (s.content || '')).join(' ');
  }

  return {
    technologies: extractKeywords(textToScan, TECH_KEYWORDS),
    skills: extractKeywords(textToScan, SKILL_KEYWORDS)
  };
}

// 3. build Course Graph
function buildCourseGraph(syllabuses) {
  const nodes = [];
  const edges = [];
  
  let depMap = {};
  if (fs.existsSync(dependencyFile)) {
    const deps = JSON.parse(fs.readFileSync(dependencyFile, 'utf-8'));
    deps.forEach(d => {
      depMap[d.course_code] = d.depends_on;
    });
  }

  syllabuses.forEach(s => {
    const baseCode = normalizeCourseCode(s.course_code);
    nodes.push({
      id: s.course_code,
      baseId: baseCode,
      label: s.course_name
    });
  });

  nodes.forEach(node => {
    const dependsOn = depMap[node.baseId] || [];
    dependsOn.forEach(prereqBase => {
      const prereqNode = nodes.find(n => n.baseId === prereqBase);
      const sourceId = prereqNode ? prereqNode.id : prereqBase;
      edges.push({
        source: sourceId,
        target: node.id,
        relationship: "prerequisite"
      });
    });
  });

  return { nodes: nodes.map(n => ({id: n.id, label: n.label})), edges };
}

// 4. buildRiskChains (BFS)
function buildRiskChains(nodes, edges) {
  const chains = {};
  nodes.forEach(node => {
    const visited = new Set();
    const queue = [node.id];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const edge of edges) {
        if (edge.source === current) {
          if (!visited.has(edge.target)) {
            visited.add(edge.target);
            queue.push(edge.target);
          }
        }
      }
    }
    chains[node.id] = {
      impacts: Array.from(visited)
    };
  });
  return chains;
}

// 5. buildCareerPaths (Dynamic mapping)
function buildCareerPaths(coursesOutput) {
  const careerPaths = {};
  for (const career of Object.keys(CAREER_REQUIREMENTS)) {
    careerPaths[career] = [];
  }

  coursesOutput.forEach(course => {
    const courseKnowledge = [...course.skills, ...course.technologies];
    for (const [career, reqs] of Object.entries(CAREER_REQUIREMENTS)) {
      const matches = courseKnowledge.filter(k => reqs.includes(k));
      if (matches.length > 0) {
        careerPaths[career].push(course.courseCode);
      }
    }
  });

  return careerPaths;
}

// 6. buildCentrality
function buildCentrality(nodes, edges) {
  const centrality = {};
  nodes.forEach(n => {
    centrality[n.id] = { inDegree: 0, outDegree: 0 };
  });
  edges.forEach(e => {
    if (centrality[e.target]) centrality[e.target].inDegree++; 
    if (centrality[e.source]) centrality[e.source].outDegree++; 
  });

  let maxOutDegree = 1;
  Object.values(centrality).forEach(c => {
    if (c.outDegree > maxOutDegree) maxOutDegree = c.outDegree;
  });

  Object.values(centrality).forEach(c => {
    c.centralityScore = parseFloat((c.outDegree / maxOutDegree).toFixed(2));
  });

  return centrality;
}

// 7. buildLearningDomains
function buildLearningDomains(coursesOutput) {
  const domains = {};
  Object.keys(DOMAIN_MAPPING).forEach(d => domains[d] = []);
  
  coursesOutput.forEach(course => {
    const courseKnowledge = [...course.skills, ...course.technologies];
    for (const [domain, config] of Object.entries(DOMAIN_MAPPING)) {
      const matches = courseKnowledge.filter(k => config.keywords.includes(k));
      if (matches.length > 0) {
        domains[domain].push(course.courseCode);
      }
    }
  });
  return domains;
}

// Main execution
function main() {
  console.log("Loading syllabuses...");
  const syllabuses = loadSyllabuses();
  
  console.log("Building graph & dependencies...");
  const graphOutput = buildCourseGraph(syllabuses);
  const riskChainsOutput = buildRiskChains(graphOutput.nodes, graphOutput.edges);
  const centralityOutput = buildCentrality(graphOutput.nodes, graphOutput.edges);

  console.log("Extracting courses & calculating riskWeight...");
  const maxImpacts = Math.max(...Object.values(riskChainsOutput).map(r => r.impacts.length), 1); 

  const coursesOutput = syllabuses.map(s => {
    const extracted = extractFromCourse(s);
    const impactsCount = riskChainsOutput[s.course_code]?.impacts.length || 0;
    
    const riskWeight = parseFloat(((impactsCount / maxImpacts) * 0.9 + 0.1).toFixed(2));

    return {
      courseCode: s.course_code,
      courseName: s.course_name,
      credits: s.credits,
      skills: extracted.skills,
      technologies: extracted.technologies,
      difficulty: s.metadata?.difficulty_score > 0.7 ? "Hard" : (s.metadata?.difficulty_score > 0.4 ? "Medium" : "Easy"),
      riskWeight: riskWeight
    };
  });

  console.log("Building dynamic career paths & learning domains...");
  const careerPathsOutput = buildCareerPaths(coursesOutput);
  const learningDomainsOutput = buildLearningDomains(coursesOutput);

  coursesOutput.forEach(course => {
    course.careerTags = [];
    for (const [career, coursesInCareer] of Object.entries(careerPathsOutput)) {
      if (coursesInCareer.includes(course.courseCode)) {
        course.careerTags.push(career);
      }
    }
  });

  console.log("Generating knowledge summary...");
  const allSkills = new Set();
  const allTechs = new Set();
  coursesOutput.forEach(c => {
    c.skills.forEach(sk => allSkills.add(sk));
    c.technologies.forEach(t => allTechs.add(t));
  });

  const sortedByImpact = Object.entries(riskChainsOutput)
    .sort((a, b) => b[1].impacts.length - a[1].impacts.length)
    .map(e => e[0])
    .slice(0, 5); 

  const summaryOutput = {
    totalCourses: coursesOutput.length,
    totalSkills: allSkills.size,
    totalTechnologies: allTechs.size,
    mostCriticalCourses: sortedByImpact
  };

  console.log("Saving outputs...");
  fs.writeFileSync(path.join(knowledgeDir, 'courses.json'), JSON.stringify(coursesOutput, null, 2));
  fs.writeFileSync(path.join(knowledgeDir, 'graph.json'), JSON.stringify(graphOutput, null, 2));
  fs.writeFileSync(path.join(knowledgeDir, 'risk-chains.json'), JSON.stringify(riskChainsOutput, null, 2));
  fs.writeFileSync(path.join(knowledgeDir, 'career-paths.json'), JSON.stringify(careerPathsOutput, null, 2));
  fs.writeFileSync(path.join(knowledgeDir, 'knowledge-summary.json'), JSON.stringify(summaryOutput, null, 2));
  fs.writeFileSync(path.join(knowledgeDir, 'course-centrality.json'), JSON.stringify(centralityOutput, null, 2));
  fs.writeFileSync(path.join(knowledgeDir, 'learning-domains.json'), JSON.stringify(learningDomainsOutput, null, 2));

  console.log("Success! V4 Academic Knowledge Layer extracted to server/data/knowledge/");
}

main();
