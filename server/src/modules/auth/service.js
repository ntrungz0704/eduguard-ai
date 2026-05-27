/**
 * Auth Service
 * Handles all authentication business logic: login, token generation, user lookup.
 *
 * Design decision: Using JWT (stateless) tokens stored on the client.
 * The authGuard middleware in security/index.js will be upgraded to verify
 * these tokens in Phase 2, replacing the current header-based approach.
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../../infrastructure/database/prisma');
const AppError = require('../../shared/errors/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'eduguard_dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a signed JWT token for a given user payload.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifies a JWT token and returns its decoded payload.
 * Throws AppError on failure.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session expired. Please log in again.', 401);
    }
    throw new AppError('Invalid or malformed token.', 401);
  }
};

/**
 * Login Service
 * Looks up user by email, validates credentials (demo: password check disabled),
 * and returns a signed JWT token with user profile.
 *
 * NOTE: For the SmartGen demo, password hashing is simplified.
 * In production, use bcrypt.compare(password, user.passwordHash).
 */
const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    // Return same error for both "user not found" and "wrong password"
    // to prevent user enumeration attacks
    throw new AppError('Invalid email or password.', 401);
  }

  // TODO Phase 2: Add bcrypt.compare(password, user.passwordHash) here
  // For now: demo login accepts any password for existing users
  if (process.env.NODE_ENV === 'production' && password !== 'demo') {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const token = generateToken(tokenPayload);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
    expiresIn: JWT_EXPIRES_IN,
  };
};

/**
 * Get current user profile from token.
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  return user;
};

module.exports = { login, getMe, verifyToken, generateToken };
