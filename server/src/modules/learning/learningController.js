const { prisma } = require('../../infrastructure/database/prisma');

const readinessService = require('./readinessService');

exports.getLearningBoard = async (req, res) => {
  try {
    const { studentId, careerId } = req.params;
    
    // Find the learning board for the student and career
    const board = await prisma.learningBoard.findUnique({
      where: {
        studentId_careerId: {
          studentId,
          careerId
        }
      },
      include: {
        tasks: true
      }
    });
    
    if (board && board.tasks.length > 0) {
      // Map Prisma data back to the format frontend expects
      const formattedTasks = board.tasks.map(t => ({
        id: t.taskId, // Use taskId for frontend compatibility
        title: t.title,
        type: t.type,
        status: t.status,
        impact: t.impact,
        duration: t.duration,
        started_at: t.startedAt ? t.startedAt.toISOString().split('T')[0] : null,
        completed_at: t.completedAt ? t.completedAt.toISOString().split('T')[0] : null,
        github: t.github,
        demo: t.demo,
        screenshot: t.screenshot,
        evidenceStatus: t.evidenceStatus,
        verified: t.verified,
        points: t.points,
        updated_at: t.updatedAt ? t.updatedAt.toISOString().split('T')[0] : null
      }));

      // Calculate Readiness
      const readinessMetrics = await readinessService.calculateCareerReadiness(studentId, careerId, board.tasks);

      res.json({
        tasks: formattedTasks,
        metrics: readinessMetrics
      });
    } else {
      // Calculate Readiness even if no tasks exist (academic score is still valid)
      const readinessMetrics = await readinessService.calculateCareerReadiness(studentId, careerId, []);

      res.json({
        tasks: [],
        metrics: readinessMetrics
      });
    }
  } catch (error) {
    console.error('Error fetching learning board from DB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateLearningBoard = async (req, res) => {
  try {
    const { studentId, careerId } = req.params;
    const tasks = req.body.tasks;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Invalid tasks data format. Must be array.' });
    }

    // Upsert the learning board
    const board = await prisma.learningBoard.upsert({
      where: {
        studentId_careerId: {
          studentId,
          careerId
        }
      },
      update: {},
      create: {
        studentId,
        careerId
      }
    });

    // We can delete existing tasks and recreate them, or upsert each
    // For simplicity in Kanban syncing, we delete all tasks for this board and recreate
    await prisma.learningTask.deleteMany({
      where: { boardId: board.id }
    });

    const newTasks = tasks.map(t => ({
      boardId: board.id,
      taskId: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      impact: t.impact,
      duration: t.duration,
      startedAt: t.started_at ? new Date(t.started_at) : null,
      completedAt: t.completed_at ? new Date(t.completed_at) : null,
      github: t.github || null,
      demo: t.demo || null,
      screenshot: t.screenshot || null,
      evidenceStatus: t.evidenceStatus || 'NONE',
      verified: t.verified || false,
      points: t.points || 0
    }));

    await prisma.$transaction(
      newTasks.map(t => prisma.learningTask.create({ data: t }))
    );
    
    res.json({ success: true, message: 'Learning board updated successfully in database' });
  } catch (error) {
    console.error('Error saving learning board to DB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
