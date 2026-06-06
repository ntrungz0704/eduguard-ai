const { z } = require('zod');

exports.analyzeRawSchema = z.object({
  careerGoal: z.string().optional(),
  failedCourses: z.array(z.string().transform(v => v.toUpperCase())).min(1, "Phải có ít nhất 1 môn rớt")
});

exports.analyzeStudentSchemaParams = z.object({
  mssv: z.string().min(3)
});

exports.analyzeStudentSchemaQuery = z.object({
  careerGoal: z.string().optional()
});
