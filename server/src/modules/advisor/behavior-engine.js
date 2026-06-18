const fs = require('fs');
const path = require('path');

const mockDir = path.join(__dirname, '..', '..', '..', 'data', 'mock-lms', 'students');
let existingMockFiles = null;

function getExistingMockFiles() {
  if (existingMockFiles === null) {
    try {
      if (fs.existsSync(mockDir)) {
        const files = fs.readdirSync(mockDir);
        existingMockFiles = new Set(files.map(f => f.toUpperCase()));
      } else {
        existingMockFiles = new Set();
      }
    } catch (e) {
      console.warn("Failed to read mock students directory:", e.message);
      existingMockFiles = new Set();
    }
  }
  return existingMockFiles;
}

exports.analyzeBehavior = (studentId) => {
  const defaultBehavior = { behaviorScore: 0.0, riskFactors: [] };
  if (!studentId || studentId === "RAW_API") return defaultBehavior;

  const mockFileName = `${studentId.toUpperCase()}.json`;
  if (!getExistingMockFiles().has(mockFileName)) return defaultBehavior;

  const mockPath = path.join(mockDir, mockFileName);
  const data = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
  const behaviorData = data.behavior || {
    attendance: data.attendance || 0,
    quizAverage: data.quizAverage || 0,
    labCompletion: data.labCompletion || 0,
    lateAssignments: data.lateAssignments || 0,
    dataSource: "MOCK",
    confidence: 0.5
  };

  const riskFactors = [];
  
  // Attendance Risk
  const attendanceRisk = behaviorData.attendance < 60 ? 1 : behaviorData.attendance < 75 ? 0.5 : 0;
  if (attendanceRisk > 0) {
    riskFactors.push({ type: "BEHAVIOR", message: `Low Attendance (${behaviorData.attendance}%)` });
  }

  // Quiz Risk
  const quizRisk = behaviorData.quizAverage < 5 ? 1 : behaviorData.quizAverage < 7 ? 0.5 : 0;
  if (quizRisk > 0) {
    riskFactors.push({ type: "BEHAVIOR", message: `Low Quiz Average (${behaviorData.quizAverage})` });
  }

  // Lab Risk
  const labRisk = behaviorData.labCompletion < 60 ? 1 : 0;
  if (labRisk > 0) {
    riskFactors.push({ type: "BEHAVIOR", message: `Missing Labs (${behaviorData.labCompletion}% completion)` });
  }

  // Assignment Risk
  const assignmentRisk = behaviorData.lateAssignments > 2 ? 1 : behaviorData.lateAssignments > 0 ? 0.5 : 0;
  if (assignmentRisk > 0) {
    riskFactors.push({ type: "BEHAVIOR", message: `Late Assignments (${behaviorData.lateAssignments} late)` });
  }

  const behaviorScore = (
    attendanceRisk * 0.4 +
    quizRisk * 0.3 +
    labRisk * 0.2 +
    assignmentRisk * 0.1
  );

  return {
    behaviorScore: parseFloat(behaviorScore.toFixed(2)),
    confidence: behaviorData.confidence || 0.5,
    dataSource: behaviorData.dataSource || "MOCK",
    riskFactors
  };
};
