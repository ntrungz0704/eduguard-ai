const { prisma } = require('../../infrastructure/database/prisma');

const readinessService = require('./readinessService');
const { analyzeCareerFromTranscript, generateLearningTasks } = require('../../ai/engines/careerMatchingEngine');

function formatTask(t) {
  return {
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
  };
}

async function createDeterministicBoard(studentId, careerId) {
  const student = await prisma.student.findUnique({
    where: { mssv: String(studentId).toUpperCase() },
    include: { scores: { include: { course: true } } }
  });
  const analysis = analyzeCareerFromTranscript(student?.scores || [], careerId);
  if (analysis.missing_data) return [];

  const generatedTasks = generateLearningTasks(careerId, analysis);
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

  await prisma.$transaction(
    generatedTasks.map(t => prisma.learningTask.create({
      data: {
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
      }
    }))
  );

  return generatedTasks;
}

async function syncDeterministicBoard(studentId, careerId, existingTasks = []) {
  const student = await prisma.student.findUnique({
    where: { mssv: String(studentId).toUpperCase() },
    include: { scores: { include: { course: true } } }
  });
  const analysis = analyzeCareerFromTranscript(student?.scores || [], careerId);
  if (analysis.missing_data) return existingTasks.map(formatTask);

  const existingByTitle = new Map(existingTasks.map(task => [String(task.title || '').toLowerCase(), task]));
  const deterministicTasks = generateLearningTasks(careerId, analysis).map(task => {
    const existing = existingByTitle.get(String(task.title || '').toLowerCase());
    if (!existing) return task;

    const transcriptLockedStatus = task.status === 'DONE' || task.status === 'IN_PROGRESS';
    return {
      ...task,
      id: existing.taskId || task.id,
      status: transcriptLockedStatus ? task.status : existing.status,
      started_at: task.started_at || (existing.startedAt ? existing.startedAt.toISOString().split('T')[0] : null),
      completed_at: task.completed_at || (existing.completedAt ? existing.completedAt.toISOString().split('T')[0] : null),
      github: existing.github || null,
      demo: existing.demo || null,
      screenshot: existing.screenshot || null,
      evidenceStatus: task.status === 'DONE' ? 'VERIFIED' : (existing.evidenceStatus || 'NONE'),
      verified: task.status === 'DONE' ? true : existing.verified,
      points: existing.points || 0
    };
  });

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

  await prisma.learningTask.deleteMany({
    where: { boardId: board.id }
  });

  await prisma.$transaction(
    deterministicTasks.map(t => prisma.learningTask.create({
      data: {
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
      }
    }))
  );

  return deterministicTasks;
}

exports.getLearningBoard = async (req, res) => {
  try {
    const { careerId } = req.params;
    const studentId = String(req.params.studentId || '').toUpperCase();
    
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
      const formattedTasks = await syncDeterministicBoard(studentId, careerId, board.tasks);

      // Calculate Readiness
      const readinessMetrics = await readinessService.calculateCareerReadiness(studentId, careerId, formattedTasks);

      res.json({
        tasks: formattedTasks,
        metrics: readinessMetrics
      });
    } else {
      const generatedTasks = await createDeterministicBoard(studentId, careerId);
      const readinessMetrics = await readinessService.calculateCareerReadiness(studentId, careerId, generatedTasks);

      res.json({
        tasks: generatedTasks,
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
    const { careerId } = req.params;
    const studentId = String(req.params.studentId || '').toUpperCase();
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
