/**
 * Security Middleware Suite
 * Centralizes all authentication & authorization checks for incoming requests.
 *
 * authGuard: Reads x-user-role / x-user-id headers (set by Axios interceptor)
 *            and attaches a standardized req.user object for downstream use.
 *            In Phase 2 this will be upgraded to full JWT verification.
 */

const AppError = require('../../shared/errors/AppError');

/**
 * Reads user identity from request headers and attaches req.user.
 * Acts as the bridge between the frontend session and backend authorization.
 */
const authGuard = (req, res, next) => {
  const role = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];

  if (!role || !userId) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  const VALID_ROLES = ['ADMIN', 'ADVISOR', 'STUDENT'];
  if (!VALID_ROLES.includes(role.toUpperCase())) {
    return next(new AppError('Invalid user role detected.', 403));
  }

  req.user = {
    id: userId,
    role: role.toUpperCase(),
  };

  return next();
};

/**
 * Lightweight guard for public routes that optionally attach user info.
 * Does NOT throw an error if headers are missing.
 */
const optionalAuth = (req, res, next) => {
  const role = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];

  if (role && userId) {
    req.user = { id: userId, role: role.toUpperCase() };
  }

  return next();
};

module.exports = { authGuard, optionalAuth };
