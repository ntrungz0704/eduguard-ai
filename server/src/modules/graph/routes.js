const express = require('express');
const router = express.Router();
const GraphController = require('./controller');

router.get('/dependencies', GraphController.getDependencies);
router.get('/risk-analysis', GraphController.getRiskAnalysis);

module.exports = router;
