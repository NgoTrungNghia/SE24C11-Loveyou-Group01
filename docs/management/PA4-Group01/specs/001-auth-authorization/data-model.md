# data-model.md

## Entities

### User
- id: UUID (primary)
- username: string, unique, required
- email: string, unique, required
- passwordHash: string, required
- phone: string | null
- role: enum [USER, ADMIN]
- status: enum [ACTIVE, DISABLED]
- createdAt: timestamp
- updatedAt: timestamp

Validation rules:
- `username` and `email` are required and unique
- `password` must be at least 6 characters (enforced before hashing)

### PasswordResetToken
- id: UUID (primary)
- token: string (secure random)
- userId: FK -> User.id
- expiresAt: timestamp
- createdAt: timestamp

Behavior:
- When a reset token is created, `expiresAt` = now + 15 minutes
- On successful reset, delete any outstanding tokens for that user

## Prisma notes
- Reuse existing `User` model; add `passwordResetToken` model with relation to `User`.
- Use `@unique` on `email` and `username` fields.
