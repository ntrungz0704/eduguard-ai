const { prisma } = require('../../infrastructure/database/prisma');

exports.getClassRoadmapProgress = async (req, res) => {
  try {
    // 1. Get all learning boards
    const boards = await prisma.learningBoard.findMany({
      include: {
        student: true,
        tasks: true
      }
    });

    // 2. Calculate statistics
    const totalStudents = await prisma.student.count();
    
    // Group by career
    const careerDistribution = {};
    const topStudents = [];
    
    boards.forEach(board => {
      // Career count
      if (!careerDistribution[board.careerId]) {
        careerDistribution[board.careerId] = 0;
      }
      careerDistribution[board.careerId]++;
      
      // Student progress
      const totalTasks = board.tasks.length;
      const doneTasks = board.tasks.filter(t => t.status === 'DONE').length;
      const verifiedTasks = board.tasks.filter(t => t.verified).length;
      const totalPoints = board.tasks.reduce((sum, t) => sum + (t.points || 0), 0);
      const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      
      topStudents.push({
        mssv: board.studentId,
        name: board.student?.name || 'Unknown',
        careerId: board.careerId,
        progressPercent,
        doneTasks,
        totalTasks,
        verifiedTasks,
        points: totalPoints
      });
    });
    
    // Sort students by points and progress
    topStudents.sort((a, b) => b.points - a.points || b.progressPercent - a.progressPercent);

    // Format for charts
    const careerChartData = Object.keys(careerDistribution).map(key => ({
      name: key.replace(/-/g, ' ').toUpperCase(),
      value: careerDistribution[key]
    }));

    res.json({
      success: true,
      data: {
        totalActiveStudents: totalStudents,
        careerDistribution: careerChartData,
        topPerformers: topStudents.slice(0, 10),
        needsAttention: topStudents.filter(s => s.progressPercent < 20).slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Error fetching class roadmap progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
