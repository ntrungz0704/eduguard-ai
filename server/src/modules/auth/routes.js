const express = require('express');
const router = express.Router();
const { z } = require('zod');

const authController = require('./controller');
const { jwtMiddleware } = require('./middleware');
const { validate } = require('../../middlewares/validation');

// ── Validation Schemas ────────────────────────────────────────────────────────
const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username/MSSV is required'),
    password: z.string().min(1, 'Password is required'),
    role: z.enum(['ADMIN', 'ADVISOR', 'STUDENT']).optional(),
  }),
});

// ── Public Routes (no auth required) ─────────────────────────────────────────
/**
 * POST /api/v1/auth/login
 * Authenticates a user and returns a JWT token.
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * POST /api/v1/auth/logout
 * Instructs client to clear token (stateless JWT).
 */
router.post('/logout', authController.logout);

// ── Protected Routes (JWT required) ──────────────────────────────────────────
/**
 * GET /api/v1/auth/me
 * Returns the profile of the currently authenticated user.
 */
router.get('/me', jwtMiddleware, authController.getMe);

module.exports = router;
