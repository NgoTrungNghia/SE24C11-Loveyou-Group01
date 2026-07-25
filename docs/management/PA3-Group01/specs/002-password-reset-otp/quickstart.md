# Quickstart: Validate Password Reset OTP

## Prerequisites

- Node.js 18+, backend dependencies, and reachable DATABASE_URL.
- Gmail App Password credentials configured as EMAIL_USER and EMAIL_APP_PASSWORD. Do not commit or log their values.
- Apply the Prisma migration that extends PasswordResetToken and regenerate the Prisma client.

## Start backend

From loveyou-backend:

~~~powershell
npm install
npx prisma migrate dev --name password-reset-otp
npx prisma generate
npm run dev
~~~

## End-to-end validation

1. Create/use a test user and controlled inbox.
2. POST /api/auth/forgot-password with the email. The response contains no OTP or reset token; obtain the six-digit OTP only from the inbox.
3. POST /api/auth/verify-otp with email and OTP. Confirm a 10-minute resetToken is returned.
4. POST /api/auth/reset-password with resetToken and compliant new password. Confirm login succeeds with the new password.
5. Retry that resetToken and earlier OTPs. Both must fail; the password must remain unchanged.

## Negative-path validation

- Four requests for one email in an hour: no fourth email and no account disclosure.
- Five wrong OTP attempts: the later correct OTP fails.
- Expired OTP and expired resetToken: generic failures.
- Mock SMTP failure: generic retryable error, no SMTP details, and request counts toward the limit.
- Inspect test logs/responses: no OTP is exposed; resetToken is present only after successful verification.

## Automated validation

~~~powershell
npm test
~~~

Cover the behavior in contracts/password-reset-api.md and data-model.md with a mocked mail transport and test database.