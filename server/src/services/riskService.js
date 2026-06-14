const { calculateBaseRisk } = require('../ai/engines/riskEngine');
const { calculateDelayScore } = require('../utils/dataService');
const fs = require('fs');
const path = require('path');

// Helper to load JSON from server/data/knowledge
function loadKnowledgeJson(filename) {
  try {
    const p = path.join(__dirname, '..', '..', 'data', 'knowledge', filename);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn(`[riskService] Failed to load ${filename}:`, e.message);
  }
  return {};
}

const syllabusGraph = loadKnowledgeJson('syllabus_graph.json');
const courseDependency = loadKnowledgeJson('course_dependency.json');

/**
 * Computes central academic risk scores, levels and delay statistics.
 * Ensures 100% database-driven Single Source of Truth for Risk metrics.
 */
function getStudentRisk(student) {
  if (!student) {
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      delayScore: 0,
      delayStats: {
        failedCredits: 0,
        blockedCount: 0,
        maxChainDepth: 0,
        bottleneckWeight: 0
      },
      contributors: []
    };
  }

  const scores = student.scores || [];
  
  // 1. Calculate base risk score and level
  const baseRisk = calculateBaseRisk(student);

  // 2. Calculate delay score metrics
  const delayData = calculateDelayScore(scores, syllabusGraph, courseDependency);

  // 3. Risk Contributors mapping
  const factorsSum = Object.values(baseRisk.factors).reduce((a, b) => a + b, 0);
  const contributors = [];
  const factorLabels = {
    LOW_GPA: 'GPA nền tảng thấp',
    PREREQUISITE_BREAK: 'Hổng môn tiên quyết',
    TREND_DECLINE: 'GPA suy giảm qua các học kỳ',
    DELAY_RISK: 'Chỉ số trễ tiến độ tốt nghiệp'
  };

  Object.entries(baseRisk.factors).forEach(([key, val]) => {
    if (val > 0) {
      const percentage = factorsSum > 0 ? Math.round((val / factorsSum) * 100) : 0;
      contributors.push({
        factor: key,
        label: factorLabels[key] || key,
        score: val,
        percentage
      });
    }
  });
  contributors.sort((a, b) => b.score - a.score);

  return {
    riskScore: baseRisk.riskScore,
    riskLevel: baseRisk.level,
    delayScore: delayData.delayScore,
    delayStats: {
      failedCredits: delayData.failedCredits,
      blockedCount: delayData.blockedCount,
      maxChainDepth: delayData.maxChainDepth,
      bottleneckWeight: delayData.bottleneckWeight
    },
    contributors
  };
}

module.exports = {
  getStudentRisk
};
