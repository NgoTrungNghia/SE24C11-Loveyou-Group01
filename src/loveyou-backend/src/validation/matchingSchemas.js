const { z } = require('zod');

const swipeSchema = z.object({
  targetId: z.number().int().positive('Target ID must be a positive integer'),
  action: z.enum(['LIKE', 'PASS', 'SUPER_LIKE'], {
    errorMap: () => ({ message: 'Action must be LIKE, PASS, or SUPER_LIKE' }),
  }),
});

module.exports = {
  swipeSchema,
};
