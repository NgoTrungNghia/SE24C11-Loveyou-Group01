const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function createDefaultTransporter() {
  const pass = String(config.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 6000,
    auth: {
      user: config.EMAIL_USER,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
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

async function sendViaGoogleScript(to, subject, text, html) {
  if (!config.GOOGLE_SCRIPT_EMAIL_URL) return false;
  try {
    const res = await fetch(config.GOOGLE_SCRIPT_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        to,
        subject,
        text,
        html,
      }),
      redirect: 'follow',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Google Script API Exception]:', err.message);
    return false;
  }
}

async function sendViaBrevo(to, subject, text, html) {
  if (!config.BREVO_API_KEY) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': config.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'LoveYou',
          email: config.EMAIL_USER || 'levanhoangtan2005@gmail.com',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.warn('[Brevo API Error]:', errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Brevo API Exception]:', err.message);
    return false;
  }
}

async function sendViaResend(to, subject, text, html) {
  if (!config.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LoveYou <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.warn('[Resend API Error]:', errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Resend API Exception]:', err.message);
    return false;
  }
}

async function sendPasswordResetOtp(to, otpCode) {
  const subject = 'Your LoveYou password reset code';
  const text = `Your LoveYou password reset code is ${otpCode}.\n\nThis code expires in 10 minutes.\nIf you did not request a password reset, you can ignore this email.`;
  const html = `<p>Your LoveYou password reset code is <strong>${otpCode}</strong>.</p><p>This code expires in 10 minutes.</p><p>If you did not request a password reset, you can ignore this email.</p>`;

  if (config.GOOGLE_SCRIPT_EMAIL_URL) {
    const sent = await sendViaGoogleScript(to, subject, text, html);
    if (sent) return;
  }

  if (config.BREVO_API_KEY) {
    const sent = await sendViaBrevo(to, subject, text, html);
    if (sent) return;
  }

  if (config.RESEND_API_KEY) {
    const sent = await sendViaResend(to, subject, text, html);
    if (sent) return;
  }

  const transport = getTransporter();
  await transport.sendMail({
    from: {
      name: 'LoveYou',
      address: config.EMAIL_USER,
    },
    to,
    subject,
    text,
    html,
  });
}

async function sendEmailVerificationOtp(to, otpCode) {
  const subject = 'Mã xác thực email tài khoản LoveYou';
  const text = `Mã xác thực tài khoản email LoveYou của bạn là: ${otpCode}\n\nMã có hiệu lực trong 10 phút.\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email.`;
  const html = `
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
    `;

  if (config.GOOGLE_SCRIPT_EMAIL_URL) {
    const sent = await sendViaGoogleScript(to, subject, text, html);
    if (sent) return;
  }

  if (config.BREVO_API_KEY) {
    const sent = await sendViaBrevo(to, subject, text, html);
    if (sent) return;
  }

  if (config.RESEND_API_KEY) {
    const sent = await sendViaResend(to, subject, text, html);
    if (sent) return;
  }

  const transport = getTransporter();
  await transport.sendMail({
    from: {
      name: 'LoveYou App',
      address: config.EMAIL_USER,
    },
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendPasswordResetOtp,
  sendEmailVerificationOtp,
  getTransporter,
  setTransporter,
  resetTransporter,
};
