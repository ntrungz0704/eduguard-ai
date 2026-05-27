const express = require('express');
const router = express.Router();
const GraphController = require('./controller');

router.get('/dependencies', GraphController.getDependencies);
router.get('/risk-analysis', GraphController.getRiskAnalysis);
router.get('/student-risk/:mssv', GraphController.getStudentRiskChain);

module.exports = router;
