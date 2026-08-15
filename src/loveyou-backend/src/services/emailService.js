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

async function sendEmailVerificationOtp(to, otpCode) {
  const transport = getTransporter();
  await transport.sendMail({
    from: {
      name: 'LoveYou App',
      address: config.EMAIL_USER,
    },
    to,
    subject: 'Mã xác thực email tài khoản LoveYou',
    text: `Mã xác thực tài khoản email LoveYou của bạn là: ${otpCode}\n\nMã có hiệu lực trong 10 phút.\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #12151b; color: #ffffff; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,45,85,0.3);">
        <h2 style="color: #FF2D55; margin-top: 0; font-size: 22px;">💖 LoveYou - Xác Thực Email</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Chào bạn, mã xác thực để kích hoạt trạng thái xác minh email cho tài khoản LoveYou của bạn là:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #FFD700; background: rgba(255,255,255,0.08); padding: 12px 28px; border-radius: 12px; display: inline-block; border: 1px solid rgba(255,215,0,0.4);">
            ${otpCode}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">Mã có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
      </div>
    `,
  });
}

module.exports = {
  sendPasswordResetOtp,
  sendEmailVerificationOtp,
  getTransporter,
  setTransporter,
  resetTransporter,
};
