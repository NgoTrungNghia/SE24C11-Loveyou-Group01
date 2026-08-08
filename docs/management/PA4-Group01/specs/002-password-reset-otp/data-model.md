# Data Model: Password Reset OTP

## PasswordResetToken (extended)

One record represents one password-recovery lifecycle. It begins as an OTP challenge and becomes a reset authorization after successful verification.

| Field | Type | Rules and purpose |
|---|---|---|
| id | integer | Existing primary key. |
| userId | integer | Required relation to User. |
| token | nullable unique string | Reset authorization created after verification only; never logged. |
| expiresAt | nullable date-time | Reset-authorization expiry, 10 minutes after verification. |
| otpCodeHash | nullable string | bcrypt hash of the six-digit OTP; never plaintext. |
| otpExpiresAt | nullable date-time | 10 minutes after OTP creation. |
| verified | boolean | Defaults false; true only after valid OTP verification. |
| attemptCount | integer | Defaults 0; increment on failure; five failures invalidate. |
| createdAt | date-time | Existing creation timestamp. |

### Constraints

- Extend the existing Prisma model with otpCodeHash, otpExpiresAt, verified default false, and attemptCount default 0.
- Make token and expiresAt nullable for pre-verification OTP rows, retaining uniqueness when token exists.
- A new request deletes or invalidates earlier user records. Failed delivery deletes or invalidates the new challenge.
- A successful reset deletes all reset records belonging to the user.

## Process-local reset request rate window

Map<normalizedEmail, timestamp[]> stores request timestamps for the running process. Prune timestamps older than one hour before each check; permit at most three. Record the accepted attempt before delivery, so delivery failure counts. The state is intentionally lost on restart and not shared among application instances.

## State transitions

~~~text
no challenge
  → OTP pending (hashed code, expires in 10 minutes, verified=false, attempts=0)
  → OTP pending (wrong code; attempts + 1)
  → invalid (expired or fifth failed attempt)
  → verified/reset authorized (new token, expires in 10 minutes, verified=true)
  → consumed (password changed; all user reset records deleted)

OTP pending → invalid on delivery failure or a newer reset request
~~~