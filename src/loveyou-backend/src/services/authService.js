const prisma = require('../utils/prismaClient');
const { hashPassword, comparePassword } = require('../utils/password');
const crypto = require('crypto');

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

async function createResetToken(userId, minutes = 15) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  const record = await prisma.passwordResetToken.create({
    data: {
      token,
      expiresAt,
      user: { connect: { userId } },
    },
  });
  return record;
}

async function verifyResetToken(token) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.expiresAt < new Date()) return null;
  return record;
}

async function resetPassword(token, newPassword) {
  const record = await verifyResetToken(token);
  if (!record) return null;
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { userId: record.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });
  return true;
}

module.exports = { createUser, findByEmail, findByUsername, verifyCredentials, createResetToken, verifyResetToken, resetPassword };
