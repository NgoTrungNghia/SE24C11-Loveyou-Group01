# Data Model: 012-live-support-chat

## Database Schema (Prisma)

```prisma
model SupportConversation {
  id        Int              @id @default(autoincrement())
  userId    Int              @unique @map("user_id")
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")

  user      User             @relation("UserSupportConversation", fields: [userId], references: [userId], onDelete: Cascade)
  messages  SupportMessage[]

  @@map("support_conversations")
}

model SupportMessage {
  id             Int                 @id @default(autoincrement())
  conversationId Int                 @map("conversation_id")
  senderId       Int                 @map("sender_id")
  content        String              @db.Text
  isFromAdmin    Boolean             @default(false) @map("is_from_admin")
  createdAt      DateTime            @default(now()) @map("created_at")

  conversation   SupportConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User                @relation("SupportMessageSender", fields: [senderId], references: [userId], onDelete: Cascade)

  @@map("support_messages")
}
```
