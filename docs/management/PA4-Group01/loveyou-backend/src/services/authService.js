const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const { hashPassword, comparePassword } = require('../utils/password');
const rateLimiter = require('./resetRateLimiter');
const emailService = require('./emailService');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

async function createUser({ username, email, password, phoneNumber }) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { username, email, passwordHash, phoneNumber } });
  return user;
}

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

async function verifyCredentials(email, password) {
  const user = await findByEmail(email);
  if (!user) return null;
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

function deliveryFailedError() {
  const err = new Error('Unable to send reset email. Please try again later.');
  err.status = 503;
  err.code = 'EMAIL_DELIVERY_FAILED';
  return err;
}

function emailNotRegisteredError() {
  const err = new Error('No account is registered with this email.');
  err.status = 404;
  err.code = 'EMAIL_NOT_REGISTERED';
  return err;
}

async function requestPasswordResetOtp(email) {
  const user = await findByEmail(email);
  if (!user) {
    throw emailNotRegisteredError();
  }

  if (!rateLimiter.canRequest(email)) {
    return { limited: true };
  }

  // Count the request before delivery so SMTP failures still consume quota (FR-005a).
  rateLimiter.recordRequest(email);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.userId } });

  const otp = String(crypto.randomInt(100000, 1000000));
  const otpCodeHash = await hashPassword(otp);
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  const challenge = await prisma.passwordResetToken.create({
    data: {
      userId: user.userId,
      otpCodeHash,
      otpExpiresAt,
      verified: false,
      attemptCount: 0,
      token: null,
      expiresAt: null,
    },
  });

  try {
    await emailService.sendPasswordResetOtp(user.email, otp);
  } catch (_err) {
    await prisma.passwordResetToken.delete({ where: { id: challenge.id } }).catch(() => {});
    throw deliveryFailedError();
  }

  return { sent: true };
}

async function verifyPasswordResetOtp(email, otp) {
  const user = await findByEmail(email);
  if (!user) return null;

  const record = await prisma.passwordResetToken.findFirst({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!record || !record.otpCodeHash || record.verified) return null;
  if (record.attemptCount >= MAX_OTP_ATTEMPTS) return null;
  if (!record.otpExpiresAt || record.otpExpiresAt < new Date()) return null;

  const matches = await comparePassword(otp, record.otpCodeHash);
  if (!matches) {
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { attemptCount: { increment: 1 } },
    });
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  const updated = await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: {
      verified: true,
      token: resetToken,
      expiresAt,
    },
  });

  return { resetToken: updated.token, expiresAt: updated.expiresAt };
}

async function resetPassword(resetToken, newPassword) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token: resetToken } });
  if (!record || !record.verified) return null;
  if (!record.expiresAt || record.expiresAt < new Date()) return null;

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { userId: record.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });
  return true;
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  verifyCredentials,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
};
