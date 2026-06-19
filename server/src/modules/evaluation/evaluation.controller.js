const evaluationService = require('./evaluation.service');

exports.getMetrics = async (req, res) => {
  try {
    const metrics = await evaluationService.getEvaluationMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve evaluation metrics', details: error.message });
  }
};

exports.triggerValidation = async (req, res) => {
  try {
    const result = await evaluationService.runValidation();
    res.json({ success: true, message: `Validated ${result.evaluatedCount} records.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run validation', details: error.message });
  }
};
