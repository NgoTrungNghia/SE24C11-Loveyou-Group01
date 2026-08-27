const { z } = require('zod');

const signupSchema = z.object({
  username: z.string({ error: 'Username is required' }).min(1, 'Username cannot be empty'),
  email: z.string({ error: 'Email is required' }).email('Enter a valid email address'),
  password: z.string({ error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required').optional(),
  username: z.string().min(1, 'Username is required').optional(),
  identifier: z.string().min(1, 'Identifier is required').optional(),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
}).refine((data) => Boolean(data.email || data.username || data.identifier), {
  message: 'Email or username is required',
  path: ['email'],
});

const forgotPasswordSchema = z.object({
  email: z.string({ error: 'Email is required' }).email('Enter a valid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string({ error: 'Email is required' }).email('Enter a valid email address'),
  otp: z
    .string({ error: 'OTP is required' })
    .regex(/^\d{6}$/, 'OTP must be a six-digit numeric code'),
});

const resetPasswordSchema = z.object({
  resetToken: z.string({ error: 'Reset token is required' }).min(1, 'Reset token is required'),
  newPassword: z.string({ error: 'New password is required' }).min(6, 'Password must be at least 6 characters'),
});

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};
