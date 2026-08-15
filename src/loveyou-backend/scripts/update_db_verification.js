const prisma = require('../src/utils/prismaClient');

async function main() {
  console.log('Running SQL migrations for Email & Citizen verification fields...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "is_email_verified" BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS "email_verify_code" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "email_verify_exp" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "is_citizen_verified" BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS "citizen_id_number" VARCHAR(50),
    ADD COLUMN IF NOT EXISTS "citizen_name" VARCHAR(100),
    ADD COLUMN IF NOT EXISTS "citizen_dob" VARCHAR(20),
    ADD COLUMN IF NOT EXISTS "citizen_gender" VARCHAR(20),
    ADD COLUMN IF NOT EXISTS "citizen_address" TEXT,
    ADD COLUMN IF NOT EXISTS "citizen_issue_date" VARCHAR(20),
    ADD COLUMN IF NOT EXISTS "citizen_front_photo" TEXT,
    ADD COLUMN IF NOT EXISTS "citizen_back_photo" TEXT,
    ADD COLUMN IF NOT EXISTS "citizen_verification_status" VARCHAR(20) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS "citizen_reject_reason" TEXT,
    ADD COLUMN IF NOT EXISTS "citizen_verified_at" TIMESTAMP(3);
  `);

  console.log('✅ Columns added successfully!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
