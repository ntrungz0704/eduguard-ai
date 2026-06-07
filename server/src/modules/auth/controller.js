/**
 * Auth Controller
 * Handles HTTP request/response for auth endpoints.
 * Delegates all business logic to auth service (no logic here).
 */

const authService = require('./service');
const AppError = require('../../shared/errors/AppError');

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Returns: { user, token, expiresIn }
 */
const login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    const result = await authService.login({ username, password, role });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 * Server-side logout (stateless JWT: just instruct client to clear token).
 */
const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your local token.',
  });
};

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 * Requires: jwtMiddleware
 */
const getMe = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError('Authentication required.', 401));
    }

    const user = await authService.getMe(req.user.id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, logout, getMe };
