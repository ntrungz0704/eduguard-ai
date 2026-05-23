const express = require('express');
const router = express.Router();
const predictionController = require('./controller');
const validator = require('./validator');

// Define prediction routes
// e.g. router.post('/upload-predict', validator.validateUpload, predictionController.handleUploadPredict);

module.exports = router;
