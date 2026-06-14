const fs = require('fs');
const path = require('path');
const { calculateFptGPA, calculateDelayScore } = require('../../utils/dataService');
const { RISK_WEIGHTS, RISK_LEVELS, RISK_THRESHOLDS } = require('../config/riskRules');

function loadKnowledgeJson(filename) {
  try {
    const p = path.join(__dirname, '..', '..', '..', 'data', 'knowledge', filename);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn(`[riskEngine] Failed to load ${filename}:`, e.message);
  }
  return {};
}

// Load static graphs to calculate true prerequisite and delay indicators
const syllabusGraph = loadKnowledgeJson('syllabus_graph.json');
const courseDependency = loadKnowledgeJson('course_dependency.json');

function getRiskLevel(score) {
  if (score >= 76) return RISK_LEVELS.CRITICAL;
  if (score >= 51) return RISK_LEVELS.HIGH;
  if (score >= 26) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

/**
 * Calculates raw base risk score using Configuration Rules based ONLY on real database facts.
 * Features: low GPA, prerequisite failures, negative academic trends, and graduation delay scores.
 */
function calculateBaseRisk(student) {
  if (!student || !student.scores || student.scores.filter(s => s.value !== null).length === 0) {
    return { 
      riskScore: 0, 
      level: 'INSUFFICIENT_DATA', 
      gpa: 0, 
      avgAttendance: 100, 
      failedCourses: [], 
      zeroScores: [], 
      factors: {} 
    };
  }

  let totalScore = 0;
  const factors = {};
  const scores = student.scores || [];

  // 1. LOW GPA
  const gpaData = calculateFptGPA(scores);
  const gpa = gpaData.gpa;
  let gpaScore = 0;
  if (gpa < RISK_THRESHOLDS.MIN_PASS_SCORE && scores.length > 5) gpaScore = 100;
  else if (gpa < 6.0) gpaScore = 75;
  else if (gpa < 7.0) gpaScore = 40;
  else if (gpa < 8.0) gpaScore = 10;
  
  factors.LOW_GPA = Math.round(gpaScore * RISK_WEIGHTS.LOW_GPA);
  totalScore += factors.LOW_GPA;

  // 2. PREREQUISITE BREAK
  const failedCourses = scores.filter(s => s.status === 'FAILED' || (s.value !== null && s.value < 5.0)).map(s => s.courseId);
  let prereqScore = 0;
  if (failedCourses.length > 0) {
    const hasPrereqFail = failedCourses.some(fc => {
      const node = syllabusGraph[fc];
      return node && node.unlocks && node.unlocks.length > 0;
    });
    if (hasPrereqFail) {
      prereqScore = failedCourses.length >= 2 ? 100 : 70;
    } else {
      prereqScore = 40;
    }
  }
  factors.PREREQUISITE_BREAK = Math.round(prereqScore * RISK_WEIGHTS.PREREQUISITE_BREAK);
  totalScore += factors.PREREQUISITE_BREAK;

  // 3. TREND DECLINE
  const completedScores = scores.filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));
  const semesterGroups = {};
  completedScores.forEach(s => {
    const sem = s.semester || 'Summer 2025';
    if (!semesterGroups[sem]) semesterGroups[sem] = [];
    semesterGroups[sem].push(s);
  });
  
  const getSemesterVal = (semStr) => {
    const lower = (semStr || '').toLowerCase();
    const match = lower.match(/\d+/);
    const year = match ? parseInt(match[0]) : 2025;
    let term = 0.2;
    if (lower.includes('summer')) term = 0.5;
    if (lower.includes('fall')) term = 0.8;
    return year + term;
  };

  const sortedSemesters = Object.keys(semesterGroups).sort((a, b) => getSemesterVal(a) - getSemesterVal(b));
  let trendScore = 0;
  if (sortedSemesters.length >= 2) {
    const trendData = sortedSemesters.map(sem => {
      const stats = calculateFptGPA(semesterGroups[sem]);
      return stats.gpa;
    });
    const lastGpa = trendData[trendData.length - 1];
    const prevGpa = trendData[trendData.length - 2];
    const diff = lastGpa - prevGpa;
    
    if (trendData.length >= 3) {
      const gpa3 = trendData[trendData.length - 3];
      if (lastGpa < prevGpa && prevGpa < gpa3) {
        trendScore = 100; // Continuous decline
      }
    }
    
    if (trendScore === 0) {
      if (diff < -1.0) trendScore = 80;
      else if (diff < -0.5) trendScore = 50;
      else if (diff > 0.5) trendScore = 0;
    }
  } else if (gpa < RISK_THRESHOLDS.MIN_PASS_SCORE && completedScores.length > 0) {
    trendScore = 50;
  }

  factors.TREND_DECLINE = Math.round(trendScore * RISK_WEIGHTS.TREND_DECLINE);
  totalScore += factors.TREND_DECLINE;

  // 4. DELAY RISK (Based on Expert Heuristic Delay Index)
  let delayScoreVal = 0;
  if (failedCourses.length > 0) {
    const { delayScore } = calculateDelayScore(scores, syllabusGraph, courseDependency);
    
    if (delayScore >= 35) delayScoreVal = 100;
    else if (delayScore >= 20) delayScoreVal = 80;
    else if (delayScore >= 5) delayScoreVal = 50;
    else if (delayScore > 0) delayScoreVal = 20;
  }

  factors.DELAY_RISK = Math.round(delayScoreVal * RISK_WEIGHTS.DELAY_RISK);
  totalScore += factors.DELAY_RISK;

  const riskScore = Math.min(100, Math.round(totalScore));
  const confidenceScore = Math.min(99, Math.round(80 + (completedScores.length * 1.5)));

  return {
    riskScore,
    level: getRiskLevel(riskScore).label,
    confidenceScore,
    gpa,
    avgAttendance: 100, // Kept for API interface compatibility
    failedCourses: scores.filter(s => s.status === 'FAILED'),
    zeroScores: scores.filter(s => s.value === 0), // Kept for API interface compatibility
    factors
  };
}

module.exports = {
  calculateBaseRisk,
  getRiskLevel,
  RISK_LEVELS
};
