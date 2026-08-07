# Data Model: Onboarding Profile Wizard

```prisma
model User {
  userId            Int       @id @default(autoincrement()) @map("user_id")
  username          String    @unique @db.VarChar(50)
  email             String    @unique @db.VarChar(100)
  passwordHash      String    @map("password_hash") @db.VarChar(255)
  phoneNumber       String?   @map("phone_number") @db.VarChar(20)
  fullName          String?   @map("full_name") @db.VarChar(100)
  gender            String?   @db.VarChar(10)
  dateOfBirth       DateTime? @map("date_of_birth") @db.Date
  profilePicture    String?   @map("profile_picture") @db.VarChar(255)
  bio               String?
  height            Int?      @db.Integer
  location          String?   @db.VarChar(100)
  interests         String?   @db.Text
  photos            String?   @db.Text
  isProfileComplete Boolean   @default(false) @map("is_profile_complete")
  role              Role      @default(USER)
  status            Status    @default(ACTIVE)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  resetTokens       PasswordResetToken[]

  @@map("users")
}
```
