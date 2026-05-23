const express = require('express');
const router = express.Router();
const predictionController = require('./controller');
const { validate, predictSubjectSchema } = require('./validator');

// GET /api/v1/prediction/:subject
// We accept both GET and POST for legacy compatibility during migration
router.all('/:subject', validate(predictSubjectSchema), predictionController.predictSubject);

module.exports = router;
