const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { requireRole } = require('../../middlewares/rbac');

// ─── STUDENT ROUTES ──────────────────────────────────────────────
// Get eligible courses for retake (FAILED or Score < 5.0)
router.get('/eligible-courses', requireRole('STUDENT'), controller.getEligibleCourses);

// Get available classes for a specific course
router.get('/classes', requireRole('STUDENT'), controller.getAvailableClasses);

// Submit a registration request
router.post('/register', requireRole('STUDENT'), controller.registerRetake);

// Get registration history for the logged-in student
router.get('/history', requireRole('STUDENT'), controller.getStudentHistory);

// Get course XAI insights
router.get('/xai/:courseId', requireRole('STUDENT', 'ADVISOR', 'ADMIN'), controller.getCourseXai);


// ─── ADVISOR ROUTES ──────────────────────────────────────────────
// Get all pending/approved/rejected requests
router.get('/requests', requireRole('ADVISOR', 'ADMIN'), controller.getAllRequests);

// Approve or reject a request
router.post('/approve', requireRole('ADVISOR', 'ADMIN'), controller.approveRequest);

// Bulk approve requests
router.post('/bulk-approve', requireRole('ADVISOR', 'ADMIN'), controller.bulkApproveRequests);

module.exports = router;
