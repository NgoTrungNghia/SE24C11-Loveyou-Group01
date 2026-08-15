# Data Model: 007 AI Matching & Preferences

```prisma
model UserPreferences {
  id               Int      @id @default(autoincrement())
  userId           Int      @unique @map("user_id")
  genderPreference String   @default("all") @map("gender_preference") @db.VarChar(10) // MALE, FEMALE, OTHER, all
  minAge           Int      @default(18) @map("min_age")
  maxAge           Int      @default(45) @map("max_age")
  maxDistance      Int      @default(50) @map("max_distance") // km
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@map("user_preferences")
}
```
