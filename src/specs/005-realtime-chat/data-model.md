# Data Model: 005 Realtime Chat

```prisma
model Conversation {
  id        Int      @id @default(autoincrement())
  matchId   Int      @unique @map("match_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  match    Match     @relation(fields: [matchId], references: [matchId], onDelete: Cascade)
  messages Message[]

  @@map("conversations")
}

model Message {
  id             Int          @id @default(autoincrement())
  conversationId Int          @map("conversation_id")
  senderId       Int          @map("sender_id")
  content        String       @db.Text
  type           MessageType  @default(TEXT)
  readAt         DateTime?    @map("read_at")
  createdAt      DateTime     @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [userId], onDelete: Cascade)

  @@map("messages")
}

enum MessageType {
  TEXT
  IMAGE
  GAME_INVITE
  SYSTEM
}
```
