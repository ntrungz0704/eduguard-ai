const { z } = require('zod');

const predictSubjectSchema = z.object({
  params: z.object({
    subject: z.string().min(1, 'Subject parameter is required')
  })
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Lỗi dữ liệu đầu vào",
      details: err.errors
    });
  }
};

module.exports = {
  predictSubjectSchema,
  validate
};
