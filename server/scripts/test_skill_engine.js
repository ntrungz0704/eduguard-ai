const { handleSkillDefinition, handleSkillPrerequisite, handleSkillCompare } = require('../src/modules/chatbot/engines/skillKnowledgeEngine');
const { generateSkillRoadmap } = require('../src/modules/chatbot/engines/learningRoadmapEngine');

async function run() {
  console.log("=== TEST: SKILL DEFINITION ===");
  console.log(handleSkillDefinition("Node.js"));
  console.log("\n=== TEST: SKILL PREREQUISITE ===");
  // Test with a dummy session context
  const sessionCtx = { completedCourses: ["WEB206", "PRO1014"] };
  console.log(handleSkillPrerequisite("Node.js", sessionCtx));
  
  console.log("\n=== TEST: SKILL COMPARE ===");
  console.log(handleSkillCompare("Node.js", "Express.js"));

  console.log("\n=== TEST: SKILL ROADMAP ===");
  const roadmap = await generateSkillRoadmap("PS47261", "React", false);
  console.log(roadmap.message);
}

run().catch(console.error);
