const express = require('express');
const router = express.Router();
const { z } = require('zod');

const studentsController = require('./controller');
const { jwtMiddleware } = require('../auth/middleware');
const { validate, commonSchemas } = require('../../middlewares/validation');
const { auditLog, AUDIT_ACTIONS } = require('../../middlewares/audit');

// ── Validation Schemas ────────────────────────────────────────────────────────
const listStudentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    risk: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    classCode: z.string().optional(),
    search: z.string().max(100).optional(),
  }),
});

const studentParamSchema = z.object({
  params: commonSchemas.mssvParam,
});

// ── All student routes require authentication ─────────────────────────────────
router.use(jwtMiddleware);

/**
 * GET /api/v1/students
 * Lists students with optional filtering and pagination.
 * Access: ADMIN, ADVISOR
 */
router.get(
  '/',
  validate(listStudentsSchema),
  auditLog(AUDIT_ACTIONS.VIEW_STUDENT_LIST),
  studentsController.listStudents
);

/**
 * GET /api/v1/students/:mssv
 * Returns the full academic profile of a student.
 * Access: ADMIN, ADVISOR
 */
router.get(
  '/:mssv',
  validate(studentParamSchema),
  auditLog(AUDIT_ACTIONS.VIEW_STUDENT_PROFILE),
  studentsController.getStudent
);

/**
 * GET /api/v1/students/:mssv/risk
 * Returns aggregated risk profile and latest predictions for a student.
 * Access: ADMIN, ADVISOR
 */
router.get(
  '/:mssv/risk',
  validate(studentParamSchema),
  auditLog(AUDIT_ACTIONS.VIEW_STUDENT_RISK),
  studentsController.getStudentRisk
);

module.exports = router;

