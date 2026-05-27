/**
 * Unified Validation Middleware
 * Provides a single, reusable validate() factory for all API routes.
 *
 * Uses Zod for schema validation and returns a standardized Enterprise
 * error response format on failure — consistent across the entire API.
 *
 * Usage:
 *   const { validate } = require('../middlewares/validation');
 *   router.post('/endpoint', validate(myZodSchema), controller.fn);
 *
 * Schema shape expected by validate():
 *   z.object({ body: z.object({...}), query: z.object({...}), params: z.object({...}) })
 */

const { z } = require('zod');

/**
 * Formats Zod validation errors into a clean, readable structure.
 * Maps each field path to its error message.
 */
const formatZodErrors = (zodError) => {
  return zodError.errors.reduce((acc, issue) => {
    const path = issue.path.join('.') || 'root';
    acc[path] = issue.message;
    return acc;
  }, {});
};

/**
 * validate(schema) — Express middleware factory.
 * Validates req.body, req.query, and req.params against a Zod schema.
 * Returns a 400 BAD_REQUEST with full field-level details on failure.
 */
const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed. Please check the request data.',
          details: formatZodErrors(result.error),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Attach parsed (sanitized) values back to request
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Common reusable schema fragments for use across modules.
 */
const commonSchemas = {
  /** Standard pagination query params */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  /** Student MSSV param */
  mssvParam: z.object({
    mssv: z.string().min(1, 'MSSV is required').max(20),
  }),

  /** Course ID param */
  courseIdParam: z.object({
    courseId: z.string().min(1, 'Course ID is required').max(20),
  }),
};

module.exports = { validate, commonSchemas };
