const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateOfficialGPA } = require('../utils/dataService');

/**
 * Perform a full database audit of all students.
 * Ensures the Single Source of Truth (SSOT) logic is correctly applied 
 * to all scores, recalculating GPA and logging discrepancies if any.
 */
async function runGlobalDataIntegrityAudit() {
  const students = await prisma.student.findMany({
    include: { scores: true }
  });

  const report = {
    scanned: students.length,
    passed: 0,
    failed: 0,
    discrepancies: []
  };

  for (const student of students) {
    try {
      const gpaData = calculateOfficialGPA(student.scores);
      
      // Enforce the integrity by ensuring the GPA engine executes successfully
      if (!gpaData || typeof gpaData.gpa !== 'number') {
        throw new Error("Invalid GPA Output");
      }

      // Check if student has corrupted scores (e.g. negative values)
      const corruptedScores = student.scores.filter(s => s.value !== null && (s.value < 0 || s.value > 10));
      if (corruptedScores.length > 0) {
        report.failed++;
        report.discrepancies.push({
          mssv: student.mssv,
          field: "score",
          expected: "0-10",
          actual: corruptedScores.map(c => `${c.courseCode}:${c.value}`).join(',')
        });
        continue;
      }

      report.passed++;
    } catch (err) {
      report.failed++;
      report.discrepancies.push({
        mssv: student.mssv,
        field: "gpa",
        expected: "Valid number",
        actual: err.message
      });
    }
  }

  const integrityStatus = report.failed === 0 ? "PASS" : "FAIL";

  // Simulate logging into DB or output
  return {
    status: integrityStatus,
    timestamp: new Date().toISOString(),
    details: report
  };
}

module.exports = {
  runGlobalDataIntegrityAudit
};
