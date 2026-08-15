const dotenv = require('dotenv');
dotenv.config();

const { env } = process;

if (!env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set');
}

function trimOrUndefined(value) {
  if (value == null) return value;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
}

module.exports = {
  DATABASE_URL: trimOrUndefined(env.DATABASE_URL),
  JWT_SECRET: trimOrUndefined(env.JWT_SECRET),
  PORT: trimOrUndefined(env.PORT) || 3000,
  EMAIL_USER: trimOrUndefined(env.EMAIL_USER),
  EMAIL_APP_PASSWORD: String(env.EMAIL_APP_PASSWORD || '').replace(/['"]/g, '').replace(/\s+/g, '') || undefined,
  RESEND_API_KEY: trimOrUndefined(env.RESEND_API_KEY),
  BREVO_API_KEY: trimOrUndefined(env.BREVO_API_KEY),
  GOOGLE_SCRIPT_EMAIL_URL: trimOrUndefined(env.GOOGLE_SCRIPT_EMAIL_URL),
  PAYOS_CLIENT_ID: trimOrUndefined(env.PAYOS_CLIENT_ID),
  PAYOS_API_KEY: trimOrUndefined(env.PAYOS_API_KEY),
  PAYOS_CHECKSUM_KEY: trimOrUndefined(env.PAYOS_CHECKSUM_KEY),
};

