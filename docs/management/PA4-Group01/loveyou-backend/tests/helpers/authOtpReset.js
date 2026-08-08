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
  await prisma.passwordResetToken.deleteMany({});
  await prisma.user.deleteMany({});
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
