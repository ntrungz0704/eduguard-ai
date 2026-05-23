const predictionService = require('./service');

// Controller acts as the HTTP interface layer
const handlePredict = async (req, res, next) => {
  try {
    // Extract validated params
    // const result = await predictionService.predictRisk(req.params.subject);
    res.json({ message: "Modular prediction endpoint ready for migration" });
  } catch (error) {
    next(error); // Pass to Global Error Handler
  }
};

module.exports = {
  handlePredict
};
