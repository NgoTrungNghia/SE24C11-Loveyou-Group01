-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "token" DROP NOT NULL;
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expires_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN "otp_code_hash" VARCHAR(255),
ADD COLUMN "otp_expires_at" TIMESTAMP(3),
ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 0;
