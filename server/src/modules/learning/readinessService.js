const { prisma } = require('../../infrastructure/database/prisma');
const { analyzeCareerFromTranscript } = require('../../ai/engines/careerMatchingEngine');

exports.calculateCareerReadiness = async (studentId, careerId, boardTasks, studentObj = null) => {
  try {
    const student = studentObj || await prisma.student.findUnique({
      where: { mssv: String(studentId).toUpperCase() },
      include: {
        scores: {
          include: { course: true }
        }
      }
    });

    const analysis = analyzeCareerFromTranscript(student?.scores || [], careerId);
    const tasks = Array.isArray(boardTasks) ? boardTasks : [];
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'DONE');
    const learningProgress = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;
    const verifiedTasks = doneTasks.filter(t => t.evidenceStatus === 'VERIFIED' || t.verified);

    return {
      readinessScore: analysis.missing_data ? 0 : analysis.matchRate,
      academicScore: analysis.missing_data ? 0 : analysis.matchRate,
      industryScore: learningProgress,
      portfolioScore: Math.min(100, verifiedTasks.length * 20),
      coverage: analysis.missing_data ? 0 : analysis.coverage,
      confidence: analysis.missing_data ? 'Low' : analysis.confidence,
      backendLocked: true
    };
  } catch (err) {
    console.error('Error calculating deterministic career readiness:', err);
    return {
      readinessScore: 0,
      academicScore: 0,
      industryScore: 0,
      portfolioScore: 0,
      coverage: 0,
      confidence: 'Low',
      backendLocked: true
    };
  }
};
