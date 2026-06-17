const express = require('express');
const router = express.Router();
const predictionController = require('./controller');
const { validate, predictSubjectSchema } = require('./validator');
const { jwtMiddleware } = require('../auth/middleware');
const { requireRole } = require('../../middlewares/rbac');

router.use(jwtMiddleware);
router.use(requireRole('ADMIN', 'ADVISOR'));

// GET /api/v1/prediction/:subject
// We accept both GET and POST for legacy compatibility during migration
router.all('/:subject', validate(predictSubjectSchema), predictionController.predictSubject);

module.exports = router;
