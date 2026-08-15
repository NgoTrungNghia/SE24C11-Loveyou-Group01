const prisma = require('../src/utils/prismaClient');

async function updateDb() {
  await prisma.$executeRawUnsafe('ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "resolution" VARCHAR(50);');
  console.log('✅ Added resolution column to reports table successfully');
}

updateDb().catch(console.error).finally(() => process.exit(0));
