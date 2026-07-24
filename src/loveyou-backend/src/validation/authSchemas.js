const { z } = require('zod');

const signupSchema = z.object({
  username: z.string({ error: 'Username is required' }).min(1, 'Username cannot be empty'),
  email:    z.string({ error: 'Email is required' }).email('Enter a valid email address'),
  password: z.string({ error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  phone:    z.string().optional(),
});

const loginSchema = z.object({
  email:    z.string({ error: 'Email is required' }).email('Enter a valid email address'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

const passwordResetRequestSchema = z.object({
  email: z.string({ error: 'Email is required' }).email('Enter a valid email address'),
});

const passwordResetConfirmSchema = z.object({
  token:       z.string({ error: 'Reset token is required' }).min(1, 'Reset token is required'),
  newPassword: z.string({ error: 'New password is required' }).min(6, 'Password must be at least 6 characters'),
});

module.exports = { signupSchema, loginSchema, passwordResetRequestSchema, passwordResetConfirmSchema };
