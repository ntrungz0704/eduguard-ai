const service = require('./service');

exports.getCourseInfo = (req, res, next) => {
  try {
    const data = service.getCourse(req.params.courseId);
    if (!data) return res.status(404).json({ success: false, error: "Course not found" });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getRiskChain = (req, res, next) => {
  try {
    const data = service.getRiskChain(req.params.courseId);
    if (!data) return res.status(404).json({ success: false, error: "Risk chain not found" });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getCareerPath = (req, res, next) => {
  try {
    const data = service.getCareerPath(req.params.goal);
    if (!data) return res.status(404).json({ success: false, error: "Career path not found" });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getSummary = (req, res, next) => {
  try {
    const data = service.getSummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getAllCareers = async (req, res, next) => {
  try {
    const mssv = req.query.mssv;
    const data = await service.getAllCareers(mssv);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.analyzeStudentCareer = async (req, res, next) => {
  try {
    const data = await service.analyzeStudentCareer(req.params.goal, req.params.mssv);
    if (!data) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
