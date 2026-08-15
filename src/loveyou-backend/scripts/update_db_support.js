const prisma = require('../src/utils/prismaClient');

async function main() {
  console.log('Running SQL migrations for Support Chat tables...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "support_conversations" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users"("user_id") ON DELETE CASCADE,
      "last_message_text" TEXT,
      "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "user_unread_count" INTEGER NOT NULL DEFAULT 0,
      "admin_unread_count" INTEGER NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "support_messages" (
      "id" SERIAL PRIMARY KEY,
      "conversation_id" INTEGER NOT NULL REFERENCES "support_conversations"("id") ON DELETE CASCADE,
      "sender_id" INTEGER NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
      "sender_role" VARCHAR(20) NOT NULL DEFAULT 'USER',
      "content" TEXT NOT NULL,
      "read_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS "idx_support_messages_conv" ON "support_messages"("conversation_id");
    CREATE INDEX IF NOT EXISTS "idx_support_conversations_user" ON "support_conversations"("user_id");
  `);

  console.log('✅ Support tables and indexes created successfully!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
