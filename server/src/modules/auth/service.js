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
const studentRepository = require('../../repositories/studentRepository');
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
const login = async ({ username, password, role = 'ADVISOR' }) => {
  if (!username || !password) {
    throw new AppError('Username and password are required.', 400);
  }

  if (role === 'STUDENT' && password !== '123456') {
    throw new AppError('Sai mật khẩu.', 401);
  }

  let tokenPayload;
  let userProfile;

  if (role === 'STUDENT') {
    // 1. Fetch from mock/Prisma student data
    const mssv = username.trim().toUpperCase();
    const student = await studentRepository.fetchStudentByMssv(mssv);
    
    if (!student) {
      throw new AppError('Tài khoản sinh viên không tồn tại trong hệ thống LMS.', 401);
    }
    
    tokenPayload = { id: student.mssv, email: `${student.mssv}@fpt.edu.vn`, role: 'STUDENT' };
    userProfile = { 
      id: student.mssv, 
      name: student.name, 
      email: tokenPayload.email, 
      role: 'STUDENT' 
    };
  } else {
    // 2. Fetch from Prisma User data for Advisors
    const normalizedUsername = username.toLowerCase().trim();
    const email = normalizedUsername === 'admin'
      ? 'admin@eduguard.ai'
      : normalizedUsername === 'advisor'
        ? 'advisor@eduguard.ai'
        : normalizedUsername;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      // Use friendly Vietnamese error message as requested
      throw new AppError('Tài khoản giảng viên không tồn tại.', 401);
    }

    if (process.env.NODE_ENV === 'production' && !['123456', 'admin123'].includes(password)) {
      throw new AppError('Sai mật khẩu.', 401);
    }

    tokenPayload = { id: user.id, email: user.email, role: user.role };
    userProfile = { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  const token = generateToken(tokenPayload);

  return {
    user: userProfile,
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
