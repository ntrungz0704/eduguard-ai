const service = require('./service');
const schemas = require('./schemas');

exports.analyzeRaw = async (req, res, next) => {
  try {
    const validated = schemas.analyzeRawSchema.parse(req.body);
    const data = await service.analyzeRaw(validated.failedCourses, validated.careerGoal);
    res.json({ success: true, data });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors });
    }
    next(err);
  }
};

exports.analyzeStudent = async (req, res, next) => {
  try {
    const params = schemas.analyzeStudentSchemaParams.parse(req.params);
    const query = schemas.analyzeStudentSchemaQuery.parse(req.query);
    const data = await service.analyzeStudent(params.mssv, query.careerGoal);
    res.json({ success: true, data });
  } catch (err) { 
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors });
    }
    next(err); 
  }
};
