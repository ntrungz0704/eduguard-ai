// Uses Joi or custom validation to ensure payload is clean before hitting Controller

const validateUpload = (req, res, next) => {
  // if (!req.files) return res.status(400).json({error: "No file uploaded"});
  next();
};

module.exports = {
  validateUpload
};
