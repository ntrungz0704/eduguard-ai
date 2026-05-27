/**
 * RBAC — Role-Based Access Control Middleware
 *
 * Provides fine-grained access control per route based on user roles.
 * Must be used AFTER jwtMiddleware or authGuard (which attaches req.user).
 *
 * Role hierarchy (highest to lowest):
 *   ADMIN > ADVISOR > STUDENT
 *
 * Usage:
 *   const { requireRole } = require('../../middlewares/rbac');
 *
 *   // Single role:
 *   router.delete('/users/:id', jwtMiddleware, requireRole('ADMIN'), controller.fn);
 *
 *   // Multiple roles (any of these can access):
 *   router.get('/students', jwtMiddleware, requireRole('ADMIN', 'ADVISOR'), controller.fn);
 */

const AppError = require('../../shared/errors/AppError');

// Define role hierarchy — higher index = higher privilege
const ROLE_HIERARCHY = ['STUDENT', 'ADVISOR', 'ADMIN'];

/**
 * requireRole(...roles) — Middleware factory.
 * Allows access only if req.user.role is one of the specified roles.
 *
 * @param  {...string} allowedRoles - Roles permitted to access this route
 * @returns {Function} Express middleware
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required before checking permissions.', 401));
  }

  const userRole = req.user.role?.toUpperCase();
  const allowed = allowedRoles.map((r) => r.toUpperCase());

  if (!allowed.includes(userRole)) {
    return next(
      new AppError(
        `Access denied. Required role(s): [${allowed.join(', ')}]. Your role: ${userRole}.`,
        403
      )
    );
  }

  return next();
};

/**
 * requireMinRole(minRole) — Hierarchy-based access.
 * Allows access if user's role is at the same level or higher than minRole.
 *
 * Example: requireMinRole('ADVISOR') allows ADVISOR and ADMIN, but not STUDENT.
 *
 * @param  {string} minRole - Minimum role required
 * @returns {Function} Express middleware
 */
const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required before checking permissions.', 401));
  }

  const userRoleLevel = ROLE_HIERARCHY.indexOf(req.user.role?.toUpperCase());
  const minRoleLevel = ROLE_HIERARCHY.indexOf(minRole.toUpperCase());

  if (userRoleLevel < minRoleLevel) {
    return next(
      new AppError(
        `Insufficient permissions. Minimum required: ${minRole}. Your role: ${req.user.role}.`,
        403
      )
    );
  }

  return next();
};

/**
 * Permission table for documentation / future policy engine.
 * Centralizes what each role can do across the system.
 */
const PERMISSIONS = {
  ADMIN: ['read:all', 'write:all', 'delete:all', 'manage:users', 'manage:system'],
  ADVISOR: ['read:students', 'write:interventions', 'read:analytics', 'use:nlp'],
  STUDENT: ['read:self'],
};

module.exports = { requireRole, requireMinRole, PERMISSIONS };
