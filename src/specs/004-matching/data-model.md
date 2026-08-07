# Data Model: 004 Matching

```prisma
model Swipe {
  swipeId   Int      @id @default(autoincrement()) @map("swipe_id")
  swiperId  Int      @map("swiper_id")
  targetId  Int      @map("target_id")
  action    String   @db.VarChar(10) // LIKE, PASS, SUPER_LIKE
  createdAt DateTime @default(now()) @map("created_at")

  swiper User @relation("SwiperUser", fields: [swiperId], references: [userId], onDelete: Cascade)
  target User @relation("TargetUser", fields: [targetId], references: [userId], onDelete: Cascade)

  @@unique([swiperId, targetId])
  @@map("swipes")
}

model Match {
  matchId   Int      @id @default(autoincrement()) @map("match_id")
  user1Id   Int      @map("user1_id")
  user2Id   Int      @map("user2_id")
  createdAt DateTime @default(now()) @map("created_at")

  user1 User @relation("MatchUser1", fields: [user1Id], references: [userId], onDelete: Cascade)
  user2 User @relation("MatchUser2", fields: [user2Id], references: [userId], onDelete: Cascade)

  @@unique([user1Id, user2Id])
  @@map("matches")
}
```
