const fs = require('fs');
const path = require('path');
const knowledgeCache = require('../knowledge/cache');

const CONFIG_PATH = path.join(__dirname, '..', '..', '..', 'data', 'risk-model-config.json');

exports.calculateKnowledgeRisk = (graphResults, careerGoal, config) => {
  const careerPaths = knowledgeCache.get('careerPaths');
  const courses = knowledgeCache.get('courses');
  const summary = knowledgeCache.get('summary');

  if (!careerPaths || !courses) throw new Error("Knowledge cache not loaded");
  
  const allImpactedSet = new Set();
  graphResults.forEach(r => r.impactedCourses.forEach(c => allImpactedSet.add(c)));
  const allImpacted = Array.from(allImpactedSet);

  const targetCareerKey = Object.keys(careerPaths).find(k => k.toLowerCase() === careerGoal?.toLowerCase());
  
  const totalCourses = summary?.totalCourses || 34; 
  const impactScore = Math.min(allImpacted.length / totalCourses, 1.0);

  let careerScore = 0.0;
  let overlap = [];
  if (targetCareerKey) {
    const careerReqs = careerPaths[targetCareerKey]?.courses || [];
    overlap = allImpacted.filter(c => careerReqs.includes(c));
    if (overlap.length > 0) careerScore = 1.0;
  }

  let critScore = 0.0;
  graphResults.forEach(r => {
    const centralityMap = knowledgeCache.get('centrality');
    if (centralityMap && centralityMap[r.failedCourse]) {
      const cScore = centralityMap[r.failedCourse].centralityScore;
      if (cScore > critScore) critScore = cScore;
    } else {
      const courseObj = courses.find(c => c.courseCode === r.failedCourse);
      if (courseObj && courseObj.riskWeight > critScore) critScore = courseObj.riskWeight;
    }
  });

  let knowledgeScore = (impactScore * config.knowledgeWeights.impact) + 
                       (careerScore * config.knowledgeWeights.career) + 
                       (critScore * config.knowledgeWeights.criticality);
                  
  knowledgeScore = parseFloat(knowledgeScore.toFixed(2));
  if (knowledgeScore > 1.0) knowledgeScore = 1.0;

  const riskFactors = graphResults.map(r => ({
    type: "KNOWLEDGE",
    message: `Failed ${r.failedCourse}`
  }));

  return {
    score: knowledgeScore,
    riskFactors,
    careerImpact: targetCareerKey || "Không xác định",
    careerOverlap: overlap,
    allImpacted
  };
};

exports.calculateOverallRisk = (graphResults, careerGoal, behaviorAnalysis) => {
  let config = { 
    engineWeights: { knowledge: 0.6, behavior: 0.4 },
    knowledgeWeights: { impact: 0.4, career: 0.2, criticality: 0.4 }, 
    thresholds: { low: 0.3, medium: 0.6, high: 0.8, critical: 1.0 } 
  };
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  }

  // 1. Knowledge Risk
  const kRisk = exports.calculateKnowledgeRisk(graphResults, careerGoal, config);

  // 2. Combine
  let finalScore = (kRisk.score * config.engineWeights.knowledge) + (behaviorAnalysis.behaviorScore * config.engineWeights.behavior);
  finalScore = parseFloat(finalScore.toFixed(2));

  let riskLevel = "LOW";
  let priority = "LOW";

  if (finalScore >= config.thresholds.high) {
    riskLevel = "CRITICAL";
    priority = "URGENT";
  } else if (finalScore >= config.thresholds.medium) {
    riskLevel = "HIGH";
    priority = "HIGH";
  } else if (finalScore >= config.thresholds.low) {
    riskLevel = "MEDIUM";
    priority = "MEDIUM";
  }

  // Explainable AI Risk Factors (Flat array of KNOWLEDGE and BEHAVIOR types)
  const riskFactors = [
    ...kRisk.riskFactors,
    ...behaviorAnalysis.riskFactors
  ];

  // Fixed Confidence
  let confidence = 0.65;

  return {
    riskLevel,
    riskScore: finalScore,
    knowledgeRisk: kRisk.score,
    behaviorRisk: behaviorAnalysis.behaviorScore,
    priority,
    confidence,
    riskFactors,
    careerImpact: kRisk.careerImpact,
    allImpacted: kRisk.allImpacted
  };
};
