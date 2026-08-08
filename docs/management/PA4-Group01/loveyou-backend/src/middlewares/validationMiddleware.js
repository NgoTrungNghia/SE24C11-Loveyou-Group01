function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }

    // Zod v4 uses .issues array
    const issues = result.error.issues || [];
    const first  = issues[0];

    // Build a human-readable message from the first issue
    const field   = first?.path?.[0] || null;
    const message = first?.message || 'Invalid input';

    return res.status(400).json({
      success: false,
      error: {
        message,
        code: 'VALIDATION_ERROR',
        field,
        // All field errors for client-side highlighting
        issues: issues.map(i => ({
          field:   i.path?.[0] || null,
          message: i.message,
        })),
      },
    });
  };
}

module.exports = validate;
