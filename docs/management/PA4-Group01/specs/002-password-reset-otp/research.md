# Research: Password Reset OTP

## Decision: Nodemailer with a reusable Gmail SMTP transport

**Rationale**: Configure one transport from EMAIL_USER and EMAIL_APP_PASSWORD, validate both at startup, use the configured sender address, and await delivery before reporting success. Delivery errors return only the generic retryable failure; production must not enable SMTP debug logging or log message bodies, OTPs, reset authorizations, or credentials.

**Alternatives considered**: Gmail API requires OAuth lifecycle work; a transactional-email provider adds an unrequested vendor decision.

## Decision: crypto.randomInt(100000, 999999)

**Rationale**: Produces the required six-digit numeric OTP using cryptographically secure randomness. The plaintext code exists only long enough to hash and send.

**Alternatives considered**: pseudo-random generation is unsuitable for credentials; alphanumeric or longer codes conflict with the specified UX.

## Decision: Extend PasswordResetToken and hash OTPs with bcrypt

**Rationale**: Add otpCodeHash, otpExpiresAt, verified, and attemptCount to the current model. Generate the reset authorization only after correct OTP verification. A new request replaces earlier records; delivery failure removes or invalidates the new record while the rate-limit event remains counted.

**Alternatives considered**: plaintext OTP storage violates requirements; a separate OTP table adds an unnecessary relation.

## Decision: Process-local email-keyed Map for the rolling hour limit

**Rationale**: The user approved this approach for the project's scale and no limiter package is installed. Prune timestamps older than one hour before each check. Count delivery failures as accepted requests.

**Alternatives considered**: express-rate-limit needs custom per-email keys and durable distributed storage; database/shared-cache counters are unnecessary for current scale.

## Decision: Generic recovery failures

**Rationale**: Request responses do not reveal account existence. Verification uses one generic failure for unknown email, wrong, expired, consumed, and invalidated OTPs. Delivery failure reveals no recipient or SMTP detail.

## Operational prerequisites

- Gmail App Passwords require 2-Step Verification and may be unavailable for managed or Advanced Protection accounts.
- EMAIL_USER and EMAIL_APP_PASSWORD are deployment/local secrets only; document names but never values.
- A transport verification check may be used for readiness diagnostics; sendMail remains authoritative for a particular message.