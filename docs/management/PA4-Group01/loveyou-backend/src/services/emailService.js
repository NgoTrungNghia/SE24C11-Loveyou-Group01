const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function createDefaultTransporter() {
  const pass = String(config.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.EMAIL_USER,
      pass,
    },
  });
}

function getTransporter() {
  if (!transporter) {
    transporter = createDefaultTransporter();
  }
  return transporter;
}

function setTransporter(customTransporter) {
  transporter = customTransporter;
}

function resetTransporter() {
  transporter = null;
}

async function sendPasswordResetOtp(to, otpCode) {
  const transport = getTransporter();
  await transport.sendMail({
    from: {
      name: 'LoveYou',
      address: config.EMAIL_USER,
    },
    to,
    subject: 'Your LoveYou password reset code',
    text: `Your LoveYou password reset code is ${otpCode}.\n\nThis code expires in 10 minutes.\nIf you did not request a password reset, you can ignore this email.`,
    html: `<p>Your LoveYou password reset code is <strong>${otpCode}</strong>.</p><p>This code expires in 10 minutes.</p><p>If you did not request a password reset, you can ignore this email.</p>`,
  });
}

module.exports = {
  sendPasswordResetOtp,
  getTransporter,
  setTransporter,
  resetTransporter,
};
