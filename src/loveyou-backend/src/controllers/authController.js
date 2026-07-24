const authService = require('../services/authService');
const { createAccessToken } = require('../utils/token');
const { success } = require('./baseController');

async function signup(req, res, next) {
  try {
    const { username, email, password, phone } = req.body;
    // Check duplicates
    const existingEmail = await authService.findByEmail(email);
    if (existingEmail) return res.status(409).json({ success: false, error: { message: 'Email already exists', code: 'DUPLICATE_FIELD', field: 'email' } });
    const existingUsername = await authService.findByUsername(username);
    if (existingUsername) return res.status(409).json({ success: false, error: { message: 'Username already exists', code: 'DUPLICATE_FIELD', field: 'username' } });
    const user = await authService.createUser({ username, email, password, phoneNumber: phone });
    const { passwordHash, ...safeUser } = user;
    return success(res, { user: safeUser }, 201);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.verifyCredentials(email, password);
    if (!user) return res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });
    const token = createAccessToken({ userId: user.userId, role: user.role });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return success(res, { token, expiresAt });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res) {
  return success(res, { message: 'Logged out' });
}

async function passwordResetRequest(req, res, next) {
  try {
    const { email } = req.body;
    const user = await authService.findByEmail(email);
    if (!user) {
      // Per spec, returning token is acceptable for testing; but to avoid enumeration, respond 200
      return success(res, { message: 'If that email exists, a reset token was created' });
    }
    const record = await authService.createResetToken(user.userId);
    return success(res, { resetToken: record.token, expiresAt: record.expiresAt });
  } catch (err) {
    return next(err);
  }
}

async function passwordResetConfirm(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const ok = await authService.resetPassword(token, newPassword);
    if (!ok) return res.status(401).json({ success: false, error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } });
    return success(res, { message: 'Password updated' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { signup, login, logout, passwordResetRequest, passwordResetConfirm };
