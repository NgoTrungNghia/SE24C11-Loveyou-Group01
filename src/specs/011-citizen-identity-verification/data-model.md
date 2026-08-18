# Data Model: 011-citizen-identity-verification

## Database Schema (Prisma)

```prisma
model User {
  userId                    Int       @id @default(autoincrement()) @map("user_id")
  isCitizenVerified         Boolean   @default(false) @map("is_citizen_verified")
  citizenIdNumber           String?   @map("citizen_id_number") @db.VarChar(50)
  citizenName               String?   @map("citizen_name") @db.VarChar(100)
  citizenDob                String?   @map("citizen_dob") @db.VarChar(20)
  citizenGender             String?   @map("citizen_gender") @db.VarChar(20)
  citizenAddress            String?   @map("citizen_address") @db.Text
  citizenIssueDate          String?   @map("citizen_issue_date") @db.VarChar(20)
  citizenFrontPhoto         String?   @map("citizen_front_photo") @db.Text
  citizenBackPhoto          String?   @map("citizen_back_photo") @db.Text
  citizenVerificationStatus String?   @default("NONE") @map("citizen_verification_status") @db.VarChar(20) // NONE, PENDING, APPROVED, REJECTED
  citizenRejectReason       String?   @map("citizen_reject_reason") @db.Text
  citizenVerifiedAt         DateTime? @map("citizen_verified_at")
}
```
