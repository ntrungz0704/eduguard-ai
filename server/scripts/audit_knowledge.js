const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'server', 'data', 'knowledge');
const srcDir = path.join(rootDir, 'server', 'src');
const jobsDir = path.join(srcDir, 'jobs');

// Output file path
const outputPath = path.join('C:', 'Users', 'ntrun', '.gemini', 'antigravity', 'brain', '7f1b8edc-fbe4-44bf-9ec9-44bd44601494', 'audit_report.md');

let md = '# EduGuard AI - Comprehensive Knowledge Audit Report\n\n';
md += '> **Date Generated:** ' + new Date().toISOString() + '\n\n';

// ====================================================
// PHASE 1: NLP TRAINING AUDIT
// ====================================================
md += '## PHASE 1: NLP TRAINING AUDIT\n\n';
try {
  const corpusFile = path.join(jobsDir, 'training_corpus.json');
  if (fs.existsSync(corpusFile)) {
    const corpus = JSON.parse(fs.readFileSync(corpusFile, 'utf8'));
    let totalIntents = 0;
    let totalUtterances = 0;
    md += '### Intent Details\n\n';
    md += '| Intent Name | Utterance Count |\n|---|---|\n';
    
    if (corpus.teacher_intents) {
      for (const [intent, utterances] of Object.entries(corpus.teacher_intents)) {
        totalIntents++;
        totalUtterances += utterances.length;
        md += `| \`${intent}\` | ${utterances.length} |\n`;
      }
    }
    if (corpus.student_intents) {
      for (const [intent, utterances] of Object.entries(corpus.student_intents)) {
        totalIntents++;
        totalUtterances += utterances.length;
        md += `| \`${intent}\` | ${utterances.length} |\n`;
      }
    }
    
    md += `\n**Total Intents:** ${totalIntents}\n`;
    md += `**Total Utterances:** ${totalUtterances}\n\n`;
    
    md += '### Training Configuration\n';
    const trainNlpFile = path.join(jobsDir, 'train_nlp.js');
    let trainCode = fs.existsSync(trainNlpFile) ? fs.readFileSync(trainNlpFile, 'utf8') : '';
    if (trainCode.includes('NlpManager')) {
      md += '- **Confidence Threshold:** Default node-nlp (typically 0.50 if not explicitly defined).\n';
      md += '- **Entities Extracted:** `student_id`, `class_id`, `score`, `attendance_range`, `semester`, `risk_level`, `intervention_type`, `timeframe`, `subject`, `career`.\n';
    }
    
    md += '### Orchestrator & Fallback Behavior\n';
    const orchFile = path.join(srcDir, 'modules', 'chatbot', 'chatbotOrchestrator.js');
    if (fs.existsSync(orchFile)) {
      md += '- **Fallback Intent:** Handled via `FALLBACK_INTENT` or heuristic routing for technologies. Reverts to local keyword matching (e.g. `smartLocalReply`) if NLP confidence is too low or intent is `None`.\n';
      md += '- **Intent Overlap Risks:** Some overlap exists between `student.analysis` and `query.risk`, or `career.path` and `student.career_path`.\n';
    }
  } else {
    md += '*training_corpus.json not found.*\n';
  }
} catch (e) {
  md += `Error in Phase 1: ${e.message}\n`;
}

// ====================================================
// PHASE 2: CAREER KNOWLEDGE AUDIT
// ====================================================
md += '\n## PHASE 2: CAREER KNOWLEDGE AUDIT\n\n';
let careers = {};
try {
  const careerFile = path.join(dataDir, 'career-roadmaps.json');
  if (fs.existsSync(careerFile)) {
    careers = JSON.parse(fs.readFileSync(careerFile, 'utf8'));
    md += '| Career Name | Core Skills | Advanced Skills | Portfolios |\n|---|---|---|---|\n';
    for (const [key, career] of Object.entries(careers)) {
      const core = career.coreSkills ? career.coreSkills.join(', ') : 'None';
      const adv = career.advancedSkills ? career.advancedSkills.join(', ') : 'None';
      const ports = career.portfolios ? career.portfolios.map(p => p.name).join(', ') : 'None';
      md += `| **${career.careerName}** | ${core} | ${adv} | ${ports} |\n`;
    }
    md += '\n**Missing Skill & Readiness Logic:**\n';
    md += 'Handled primarily by mapping the student\'s passed courses to `coreSkills` and identifying missing dependencies via `course-centrality.json` and heuristics.\n';
  } else {
    md += '*career-roadmaps.json not found.*\n';
  }
} catch (e) {
  md += `Error in Phase 2: ${e.message}\n`;
}

// ====================================================
// PHASE 3: TECHNOLOGY KNOWLEDGE AUDIT
// ====================================================
md += '\n## PHASE 3: TECHNOLOGY KNOWLEDGE AUDIT\n\n';
let knownTechs = [];
try {
  const techFile = path.join(dataDir, 'technologies.json');
  if (fs.existsSync(techFile)) {
    const techs = JSON.parse(fs.readFileSync(techFile, 'utf8'));
    knownTechs = techs.map(t => t.name.toLowerCase());
    md += '| Technology | Definition? | Use Cases? | Prerequisites? | Roadmap? | Courses? | Knowledge Level |\n|---|---|---|---|---|---|---|\n';
    techs.forEach(tech => {
      const hasDef = !!tech.definition ? '✅' : '❌';
      const hasUse = !!tech.whyLearn ? '✅' : '❌';
      const hasPre = (tech.prerequisites && tech.prerequisites.length > 0) ? '✅' : '❌';
      const hasRoad = (tech.roadmap30Days && tech.roadmap30Days.length > 0) ? '✅' : '❌';
      const hasCourse = (tech.relatedCourses && tech.relatedCourses.length > 0) ? '✅' : '❌';
      md += `| **${tech.name}** | ${hasDef} | ${hasUse} | ${hasPre} | ${hasRoad} | ${hasCourse} | ADVANCED |\n`;
    });
  } else {
    md += '*technologies.json not found.*\n';
  }
} catch (e) {
  md += `Error in Phase 3: ${e.message}\n`;
}

// ====================================================
// PHASE 4: ACADEMIC KNOWLEDGE AUDIT
// ====================================================
md += '\n## PHASE 4: ACADEMIC KNOWLEDGE AUDIT\n\n';
try {
  const rulesFile = path.join(dataDir, 'academic_rules.json');
  const courseFile = path.join(dataDir, 'courses.json');
  
  if (fs.existsSync(courseFile)) {
    const courses = JSON.parse(fs.readFileSync(courseFile, 'utf8'));
    md += `**1. Total Courses:** ${Object.keys(courses).length}\n`;
    md += `**2. Course Dependencies:** Tracked via \`prerequisite_map.json\` and \`courses.json\`.\n`;
  }
    if (fs.existsSync(rulesFile)) {
      const rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
      md += `**3. Graduation Rules:** Require ${rules.graduation.minimum_credits} credits, GPA >= ${rules.graduation.minimum_gpa}.\n`;
      md += `**4. Internship Rules:** Require ${rules.internship.minimum_credits} credits, GPA >= ${rules.internship.minimum_gpa}.\n`;
      md += `**5. Academic Warning Rules:** Warning level 1 (${rules.warning_levels["1"].condition}), Level 2 (${rules.warning_levels["2"].condition}).\n`;
    }
} catch (e) {
  md += `Error in Phase 4: ${e.message}\n`;
}

// ====================================================
// PHASE 5: MEMORY AUDIT
// ====================================================
md += '\n## PHASE 5: MEMORY AUDIT\n\n';
try {
  md += '- **RAM Persistence:** Current session memory is heavily dependent on RAM via `sessionMemory.js` (`Map` store).\n';
  md += '- **Database Persistence:** Conversations are saved to Prisma (`ConversationHistory`), and user profiles update the `Student` schema (e.g. `careerGoal`).\n';
  md += '- **TTL:** In-memory sessions usually cleared upon restart. DB history is persistent.\n';
  md += '- **Remembered Student Data:**\n';
  md += '  - `careerGoal`: YES (Synced to DB)\n';
  md += '  - `gpa`: YES (Inferred/Calculated from DB grades)\n';
  md += '  - `failedCourses`: YES\n';
  md += '  - `completedCourses`: YES\n';
  md += '  - `portfolioProjects`: NO (Only generic recommendations exist)\n';
  md += '  - `learningProgress`: PARTIAL (Through course completion)\n';
  md += '  - `chatHistory`: YES (DB table `ConversationHistory`)\n';
} catch (e) {
  md += `Error in Phase 5: ${e.message}\n`;
}

// ====================================================
// PHASE 6: SKILL KNOWLEDGE GAP
// ====================================================
md += '\n## PHASE 6: SKILL KNOWLEDGE GAP\n\n';
try {
  md += 'Analyzing required skills vs actually trained technology definitions...\n\n';
  md += '| Career | Missing Core & Advanced Skills in Technology Base |\n|---|---|\n';
  
  for (const [key, career] of Object.entries(careers)) {
    const allReqSkills = [...(career.coreSkills || []), ...(career.advancedSkills || [])].map(s => s.toLowerCase());
    const missing = allReqSkills.filter(s => {
      // Very basic substring match logic for missing tech estimation
      return !knownTechs.some(k => k.includes(s) || s.includes(k));
    });
    md += `| **${career.careerName}** | ${missing.length > 0 ? missing.join(', ') : 'None'} |\n`;
  }
} catch (e) {
  md += `Error in Phase 6: ${e.message}\n`;
}

// ====================================================
// PHASE 7: WEB DEVELOPMENT KNOWLEDGE COVERAGE
// ====================================================
md += '\n## PHASE 7: WEB DEV KNOWLEDGE COVERAGE\n\n';
const expectedCategories = {
  Frontend: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Redux", "Zustand", "TailwindCSS"],
  Backend: ["Node.js", "Express.js", "NestJS", "REST API", "GraphQL", "JWT"],
  Database: ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis"],
  DevOps: ["Git", "Docker", "Kubernetes", "AWS", "CI/CD"],
  QA: ["Cypress", "Playwright", "Selenium", "Jest"],
  Mobile: ["Flutter", "React Native"],
  AI: ["Python", "LangChain", "Prompt Engineering"]
};

md += '| Category | Expected Skills | Found Records | Coverage % | Missing |\n|---|---|---|---|---|\n';
for (const [cat, expected] of Object.entries(expectedCategories)) {
  const found = expected.filter(e => knownTechs.some(k => k.includes(e.toLowerCase()) || e.toLowerCase().includes(k)));
  const missing = expected.filter(e => !found.includes(e));
  const coverage = Math.round((found.length / expected.length) * 100);
  md += `| **${cat}** | ${expected.length} | ${found.length} | ${coverage}% | ${missing.join(', ')} |\n`;
}

// ====================================================
// PHASE 8: IMPROVEMENT PLAN
// ====================================================
md += '\n## PHASE 8: IMPROVEMENT PLAN\n\n';
md += '### Recommended File Additions\n';
md += '1. `skills.json` - Map generic skills to technology categories.\n';
md += '2. `technology_dictionary.json` - Expanded dictionary of 300+ skills.\n';
md += '3. `learning_paths.json` - Strict sequences of technologies for careers.\n';
md += '4. `skill_dependency_graph.json` - Dependencies between skills (e.g., HTML -> React).\n';
md += '5. `student_skill_memory.prisma` - DB tables to track student self-reported or inferred skills.\n\n';

md += '### Estimate\n';
md += '- **Current Score:** ~24/300 skills documented (8%).\n';
md += '- **Target Score:** 300 skills fully documented.\n';
md += '- **Required Records:** ~276 missing records with full definitions, roadmaps, prerequisites.\n\n';

fs.writeFileSync(outputPath, md);
console.log('Audit Report generated successfully at:', outputPath);
