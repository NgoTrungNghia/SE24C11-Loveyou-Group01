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
  EMAIL_APP_PASSWORD: String(env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '') || undefined,
};
