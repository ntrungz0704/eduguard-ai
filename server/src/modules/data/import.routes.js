const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('./import.controller');
const { jwtMiddleware } = require('../auth/middleware');
const { requireRole } = require('../../middlewares/rbac');

// Setup multer to store file in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/v1/data/preview
// @desc    Upload and preview excel data
// @access  Private (Advisor/Admin)
router.post('/preview', jwtMiddleware, requireRole('ADMIN', 'ADVISOR'), upload.single('file'), importController.previewData);

// @route   POST /api/v1/data/publish
// @desc    Publish validated data to database
// @access  Private (Advisor/Admin)
router.post('/publish', jwtMiddleware, requireRole('ADMIN', 'ADVISOR'), importController.publishData);

module.exports = router;
