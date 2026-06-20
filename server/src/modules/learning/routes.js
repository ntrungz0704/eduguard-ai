const express = require('express');
const router = express.Router();
const learningController = require('./learningController');
const { jwtMiddleware } = require('../auth/middleware');

router.use(jwtMiddleware);

// Define API endpoints for Learning Board
router.get('/board/:studentId/:careerId', learningController.getLearningBoard);
router.put('/board/:studentId/:careerId', learningController.updateLearningBoard);
router.get('/progress/:studentId', learningController.getStudentLearningProgress);

// Evidence will be added here later

module.exports = router;
