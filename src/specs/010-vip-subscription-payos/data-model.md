# Data Model: 010-vip-subscription-payos

## Database Schema (Prisma)

```prisma
model User {
  userId        Int       @id @default(autoincrement()) @map("user_id")
  isVip         Boolean   @default(false) @map("is_vip")
  vipUntil      DateTime? @map("vip_until")
  
  payments      Payment[]
}

model Payment {
  id            Int       @id @default(autoincrement())
  userId        Int       @map("user_id")
  orderCode     BigInt    @unique @map("order_code")
  amount        Int       @default(99000)
  description   String    @db.VarChar(255)
  status        String    @default("PENDING") @db.VarChar(50) // PENDING, PAID, CANCELLED
  paymentMethod String?   @default("PAYOS_QR") @map("payment_method") @db.VarChar(50)
  transactionId String?   @map("transaction_id") @db.VarChar(255)
  paidAt        DateTime? @map("paid_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  user          User      @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@map("payments")
}
```
