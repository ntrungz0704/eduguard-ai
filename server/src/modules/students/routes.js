const express = require('express');
const router = express.Router();
const { z } = require('zod');

const studentsController = require('./controller');
const { jwtMiddleware } = require('../auth/middleware');
const { requireRole } = require('../../middlewares/rbac');
const { validate, commonSchemas } = require('../../middlewares/validation');
const { auditLog, AUDIT_ACTIONS } = require('../../middlewares/audit');
const AppError = require('../../shared/errors/AppError');

/**
 * IDOR Protection: Allow ADMIN/ADVISOR full access.
 * STUDENT can only view their own profile (mssv must match req.user.id).
 */
const requireAdvisorOrSelf = (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required.', 401));
  const role = req.user.role?.toUpperCase();
  if (role === 'ADMIN' || role === 'ADVISOR') return next();
  if (role === 'STUDENT') {
    const requestedMssv = String(req.params.mssv || '').toUpperCase();
    const tokenMssv = String(req.user.id || '').toUpperCase();
    if (requestedMssv === tokenMssv) return next();
    return next(new AppError('Bạn không có quyền truy cập hồ sơ của sinh viên khác.', 403));
  }
  return next(new AppError('Bạn không có quyền truy cập chức năng này.', 403));
};

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
 * Access: ADMIN, ADVISOR only — Students cannot enumerate the full list.
 */
router.get(
  '/',
  requireRole('ADMIN', 'ADVISOR'),
  validate(listStudentsSchema),
  auditLog(AUDIT_ACTIONS.VIEW_STUDENT_LIST),
  studentsController.listStudents
);

/**
 * GET /api/v1/students/:mssv
 * Returns the full academic profile of a student.
 * Access: ADMIN, ADVISOR (any) | STUDENT (own profile only — IDOR protected)
 */
router.get(
  '/:mssv',
  requireAdvisorOrSelf,
  validate(studentParamSchema),
  auditLog(AUDIT_ACTIONS.VIEW_STUDENT_PROFILE),
  studentsController.getStudent
);

/**
 * GET /api/v1/students/:mssv/risk
 * Returns aggregated risk profile and latest predictions for a student.
 * Access: ADMIN, ADVISOR only — risk data is sensitive and not for self-view.
 */
router.get(
  '/:mssv/risk',
  requireRole('ADMIN', 'ADVISOR'),
  validate(studentParamSchema),
  auditLog(AUDIT_ACTIONS.VIEW_STUDENT_RISK),
  studentsController.getStudentRisk
);

module.exports = router;

