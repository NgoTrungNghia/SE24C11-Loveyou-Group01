# Data Model: 006 Image Upload & Geolocation

```prisma
// Modifications to existing User model in schema.prisma

model User {
  userId          Int      @id @default(autoincrement()) @map("user_id")
  profilePicture  String?  @map("profile_picture") @db.Text
  photos          Json?    // Array of photo URL strings
  latitude        Float?   @map("latitude")
  longitude       Float?   @map("longitude")
  location        String?  @db.VarChar(255)
  // ...other fields
}
```
