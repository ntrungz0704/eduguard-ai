/**
 * JWT Middleware
 * Verifies Bearer JWT tokens on protected routes.
 * Attaches decoded user payload to req.user.
 *
 * This upgrades the simple header-based authGuard in security/index.js
 * to full stateless JWT verification.
 *
 * Usage:
 *   const { jwtMiddleware } = require('./middleware');
 *   router.get('/protected', jwtMiddleware, controller.fn);
 */

const { verifyToken } = require('./service');
const AppError = require('../../shared/errors/AppError');

/**
 * Extracts Bearer token from Authorization header and verifies it.
 * On success: attaches req.user = { id, email, role }
 * On failure: passes AppError(401) to next()
 */
const jwtMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No authentication token provided. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Optional JWT — attaches user if token is present but does NOT block if absent.
 * Use on routes that behave differently for logged-in vs anonymous users.
 */
const optionalJwt = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    } catch {
      // Silently ignore invalid tokens on optional routes
    }
  }
  return next();
};

module.exports = { jwtMiddleware, optionalJwt };
