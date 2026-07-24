const dotenv = require('dotenv');
dotenv.config();

const { env } = process;

if (!env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set');
}

module.exports = {
  DATABASE_URL: env.DATABASE_URL,
  JWT_SECRET: env.JWT_SECRET,
  PORT: env.PORT || 3000,
};
