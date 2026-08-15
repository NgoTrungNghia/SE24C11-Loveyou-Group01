const authService = require('../services/authService');
const { createAccessToken } = require('../utils/token');
const { success } = require('./baseController');

async function signup(req, res, next) {
  try {
    const { username, email, password, phone } = req.body;
    const existingEmail = await authService.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already exists', code: 'DUPLICATE_FIELD', field: 'email' },
      });
    }
    const existingUsername = await authService.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: { message: 'Username already exists', code: 'DUPLICATE_FIELD', field: 'username' },
      });
    }
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
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
      });
    }
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

async function forgotPassword(req, res, next) {
  try {
    await authService.requestPasswordResetOtp(req.body.email);
    return success(res, { message: 'A reset code was sent to your email' });
  } catch (err) {
    if (err.code === 'EMAIL_NOT_REGISTERED' || err.code === 'EMAIL_DELIVERY_FAILED') {
      return res.status(err.status || 500).json({
        success: false,
        error: { message: err.message, code: err.code },
      });
    }
    return next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyPasswordResetOtp(email, otp);
    if (!result) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired code', code: 'INVALID_OTP' },
      });
    }
    return success(res, { resetToken: result.resetToken, expiresAt: result.expiresAt });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { resetToken, newPassword } = req.body;
    const ok = await authService.resetPassword(resetToken, newPassword);
    if (!ok) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' },
      });
    }
    return success(res, { message: 'Password updated' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signup,
  login,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
