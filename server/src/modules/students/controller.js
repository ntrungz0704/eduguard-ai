/**
 * Students Controller
 * Handles HTTP requests for student-related endpoints.
 * Pure request/response — no business logic here.
 */

const studentsService = require('./service');

/**
 * GET /api/v1/students
 * Query params: page, limit, risk (CRITICAL|HIGH|MEDIUM|LOW), classCode, search
 */
const listStudents = async (req, res, next) => {
  try {
    const { page, limit, risk, classCode, search } = req.query;
    const result = await studentsService.listStudents({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      risk,
      classCode,
      search,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/students/:mssv
 * Returns full profile: scores, predictions, interventions.
 */
const getStudent = async (req, res, next) => {
  try {
    const student = await studentsService.getStudentByMssv(req.params.mssv);
    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/students/:mssv/risk
 * Returns the aggregated risk profile summary for a student.
 */
const getStudentRisk = async (req, res, next) => {
  try {
    const profile = await studentsService.getStudentRisk(req.params.mssv);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { listStudents, getStudent, getStudentRisk };
