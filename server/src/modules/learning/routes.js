const express = require('express');
const router = express.Router();
const learningController = require('./learningController');

// Define API endpoints for Learning Board
router.get('/board/:studentId/:careerId', learningController.getLearningBoard);
router.put('/board/:studentId/:careerId', learningController.updateLearningBoard);

// Evidence will be added here later

module.exports = router;
