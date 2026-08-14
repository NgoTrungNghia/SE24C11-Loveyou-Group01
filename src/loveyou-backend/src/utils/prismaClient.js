require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = (process.env.DATABASE_URL || '').trim();

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL environment variable is missing or empty!');
}

const cleanConnectionString = connectionString.replace(/[\?&]sslmode=[^&]*/, '');

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
});

pool.on('error', (err) => {
  console.error('[pg Pool Error]:', err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
