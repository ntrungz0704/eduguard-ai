/**
 * Students Service
 * Business logic for student data retrieval and risk profile queries.
 * Delegates all DB access to Prisma — no raw SQL anywhere.
 */

const { prisma } = require('../../infrastructure/database/prisma');
const AppError = require('../../shared/errors/AppError');

// Risk level ordering for sorting
const RISK_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/**
 * List students with optional filtering by risk level and pagination.
 * Returns paginated results ordered by risk severity (highest first).
 */
const listStudents = async ({ page = 1, limit = 20, risk, classCode, search }) => {
  const skip = (page - 1) * limit;

  // Build dynamic where clause
  const where = {};
  if (classCode) where.classCode = classCode;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { mssv: { contains: search } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only the most recent prediction per student
        },
        scores: {
          where: { status: { in: ['STUDYING', 'FAILED'] } },
          select: { courseId: true, status: true, value: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.student.count({ where }),
  ]);

  // Filter by risk level after fetch (denormalized from predictions)
  let result = students.map((s) => ({
    mssv: s.mssv,
    name: s.name,
    classCode: s.classCode,
    riskLevel: s.predictions[0]?.risk || 'UNKNOWN',
    riskScore: s.predictions[0]?.predictedScore ?? null,
    activeSubjects: s.scores.length,
  }));

  if (risk) {
    result = result.filter((s) => s.riskLevel === risk.toUpperCase());
  }

  // Sort by risk severity
  result.sort((a, b) =>
    (RISK_ORDER[a.riskLevel] ?? 99) - (RISK_ORDER[b.riskLevel] ?? 99)
  );

  return {
    data: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get detailed profile of a single student including all scores and predictions.
 */
const getStudentByMssv = async (mssv) => {
  const student = await prisma.student.findUnique({
    where: { mssv },
    include: {
      scores: {
        include: { course: { select: { id: true, name: true, credits: true, prerequisites: true } } },
        orderBy: { semester: 'desc' },
      },
      predictions: {
        orderBy: { createdAt: 'desc' },
        include: { course: { select: { id: true, name: true } } },
      },
      interventions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { action: true, status: true, createdAt: true },
      },
    },
  });

  if (!student) {
    throw new AppError(`Student with MSSV "${mssv}" not found.`, 404);
  }

  const { buildAcademicSnapshot } = require('../../services/studentSnapshotService');
  student.academicSnapshot = buildAcademicSnapshot(student);

  return student;
};

/**
 * Get the aggregated risk profile summary for a single student.
 * Returns the latest prediction + key risk factors.
 */
const getStudentRisk = async (mssv) => {
  const student = await prisma.student.findUnique({
    where: { mssv },
    select: { mssv: true, name: true, classCode: true },
  });

  if (!student) {
    throw new AppError(`Student with MSSV "${mssv}" not found.`, 404);
  }

  const predictions = await prisma.prediction.findMany({
    where: { mssv },
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { id: true, name: true } } },
  });

  const highestRisk = predictions.reduce((max, pred) => {
    return (RISK_ORDER[pred.risk] ?? 99) < (RISK_ORDER[max?.risk] ?? 99) ? pred : max;
  }, predictions[0] || null);

  return {
    student,
    overallRisk: highestRisk?.risk || 'UNKNOWN',
    predictions,
    totalAtRisk: predictions.filter((p) => ['CRITICAL', 'HIGH'].includes(p.risk)).length,
  };
};

module.exports = { listStudents, getStudentByMssv, getStudentRisk };
