const { prisma } = require('../../infrastructure/database/prisma');
const dataService = require('../../utils/dataService');

/**
 * Calculates Career Readiness Score based on real backend data
 */
exports.calculateCareerReadiness = async (studentId, careerId, boardTasks, studentObj = null) => {
  try {
    // 1. Calculate Academic Score from real DB
    // Fetch all scores for student if not provided
    const student = studentObj || await prisma.student.findUnique({
      where: { mssv: studentId },
      include: {
        scores: {
          include: { course: true }
        }
      }
    });

    let academicScore = 0;
    if (student && student.scores.length > 0) {
      // Calculate weighted average using exact FPT formula to prevent double-counting retakes
      const gpaResult = dataService.calculateFptGPA(student.scores);
      if (gpaResult && gpaResult.gpa > 0) {
        academicScore = Math.round(gpaResult.gpa * 10);
      }
    }

    // 2. Calculate Industry Score based on local done tasks
    let industryScore = 0;
    let portfolioScore = 0;

    if (boardTasks && boardTasks.length > 0) {
      const totalWeight = boardTasks.reduce((sum, t) => sum + t.impact, 0);
      const doneTasks = boardTasks.filter(t => t.status === 'DONE');
      const acquiredWeight = doneTasks.reduce((sum, t) => sum + t.impact, 0);
      
      industryScore = totalWeight > 0 ? (acquiredWeight / totalWeight) * 100 : 0;

      // 3. Portfolio: based on tasks with real Github evidence
      // Points awarded by githubService are stored in 'points' field
      // 1 task VERIFIED could give max 33 points to portfolio.
      // Or we can just sum up the points awarded and cap at 100.
      let totalGithubPoints = 0;
      doneTasks.filter(t => t.evidenceStatus === 'VERIFIED').forEach(t => {
        totalGithubPoints += (t.points || 33);
      });
      portfolioScore = Math.min(100, totalGithubPoints);
    }

    // Readiness Score Formula
    const readinessScore = Math.round(
      (academicScore * 0.3) + 
      (industryScore * 0.4) + 
      (portfolioScore * 0.3)
    );

    return {
      readinessScore: Math.min(100, Math.max(0, readinessScore)),
      academicScore: Math.round(academicScore),
      industryScore: Math.round(industryScore),
      portfolioScore: Math.round(portfolioScore),
    };
  } catch (err) {
    console.error('Error calculating readiness:', err);
    return {
      readinessScore: 0,
      academicScore: 0,
      industryScore: 0,
      portfolioScore: 0,
    };
  }
};
