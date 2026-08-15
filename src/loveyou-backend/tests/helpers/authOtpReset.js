const prisma = require('../../src/utils/prismaClient');
const rateLimiter = require('../../src/services/resetRateLimiter');
const emailService = require('../../src/services/emailService');

const sentMails = [];
let shouldFailDelivery = false;

function createMockTransport() {
  return {
    async sendMail(options) {
      if (shouldFailDelivery) {
        const err = new Error('SMTP unavailable');
        throw err;
      }
      sentMails.push(options);
      return { messageId: `mock-${sentMails.length}` };
    },
  };
}

function extractOtpFromMail(mail) {
  const match = String(mail?.text || '').match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

function getLastOtp() {
  if (!sentMails.length) return null;
  return extractOtpFromMail(sentMails[sentMails.length - 1]);
}

function resetMailState() {
  sentMails.length = 0;
  shouldFailDelivery = false;
  emailService.setTransporter(createMockTransport());
}

function failNextDelivery() {
  shouldFailDelivery = true;
}

async function cleanupAuthData() {
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: '@example.com' } },
        { email: { startsWith: 'reset.' } },
        { email: { startsWith: 'user.' } },
        { email: { startsWith: 'unknown.' } },
        { username: { startsWith: 'u_' } },
      ],
    },
    select: { userId: true },
  });

  const testUserIds = testUsers.map((u) => u.userId);
  if (testUserIds.length > 0) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.user.deleteMany({ where: { userId: { in: testUserIds } } });
  }

  rateLimiter.clearAll();
  resetMailState();
}

function uniqueEmail(prefix = 'user') {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

module.exports = {
  sentMails,
  createMockTransport,
  extractOtpFromMail,
  getLastOtp,
  resetMailState,
  failNextDelivery,
  cleanupAuthData,
  uniqueEmail,
};
