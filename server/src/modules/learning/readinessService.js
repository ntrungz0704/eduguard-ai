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
      const gpaResult = dataService.calculateOfficialGPA(student.scores);
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

    // Base readiness score
    const baseReadinessScore = Math.round(
      (academicScore * 0.3) + 
      (industryScore * 0.4) + 
      (portfolioScore * 0.3)
    );

    // Aptitude match based on learning style and strengths/weaknesses
    let learningStyle = student ? student.learningStyle : undefined;
    let strengths = student ? student.strengths : undefined;
    let weaknesses = student ? student.weaknesses : undefined;

    if (student && !learningStyle) {
      try {
        const mem = await prisma.studentMemory.findUnique({
          where: { studentId }
        });
        if (mem) {
          learningStyle = mem.learningStyle;
          try { strengths = JSON.parse(mem.strengths); } catch {}
          try { weaknesses = JSON.parse(mem.weaknesses); } catch {}
        }
      } catch (e) {
        console.warn("Failed to load student memory in calculateCareerReadiness:", e);
      }
    }

    const { calculateStyleMatch } = require('../advisor/career-engine');
    const roadmaps = require('../knowledge/cache').get('careerRoadmaps') || {};
    const careerKey = Object.keys(roadmaps).find(k => {
      const slug = k.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return slug === careerId || (careerId === 'ai-engineer' && k === 'AI Fullstack Engineer');
    }) || careerId;

    const styleScore = calculateStyleMatch(
      learningStyle,
      strengths || [],
      weaknesses || [],
      careerKey
    );

    const gpaResult = dataService.calculateOfficialGPA(student ? student.scores : []);
    const gpaScore = gpaResult && gpaResult.gpa ? gpaResult.gpa * 10 : 0;
    const aptitudeScore = (styleScore * 0.6) + (gpaScore * 0.4);

    const passedCount = student && student.scores ? student.scores.filter(s => s.status === 'PASSED').length : 0;
    const progress = Math.min(1.0, passedCount / 15); // normalized at 15 passed courses

    const readinessScore = Math.round((baseReadinessScore * progress) + (aptitudeScore * (1 - progress)));

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
