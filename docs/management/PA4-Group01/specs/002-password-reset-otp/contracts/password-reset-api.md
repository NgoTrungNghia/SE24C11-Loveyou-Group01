# Password Reset API Contract

Base path: /api/auth. Success responses retain { "success": true, "data": ... }; failures retain { "success": false, "error": { "message", "code" } }.

## POST /forgot-password

Request:

~~~json
{ "email": "user@example.com" }
~~~

Validate a required email. Return 200 with a generic confirmation for known, unknown, and rate-limited emails; never include an OTP, reset authorization, or account existence information.

~~~json
{ "success": true, "data": { "message": "If that email exists, a reset code was sent" } }
~~~

On SMTP delivery failure, return a generic retryable 503-style EMAIL_DELIVERY_FAILED response with no SMTP details. The request still counts toward the per-email limit.

## POST /verify-otp

Request:

~~~json
{ "email": "user@example.com", "otp": "123456" }
~~~

Validate a required email and six-digit numeric string. Success returns a single-use resetToken and its 10-minute expiry. Failure uses one generic 401 INVALID_OTP response for unknown address, missing challenge, wrong, expired, exhausted, or invalidated code; do not reveal remaining attempts.

## POST /reset-password

Request:

~~~json
{ "resetToken": "opaque-single-use-token", "newPassword": "new-password" }
~~~

Validate a non-empty resetToken and password that meets the existing six-character minimum. Success returns Password updated. Failure uses the existing generic 401 invalid-or-expired-token response and leaves the password unchanged. Success deletes all user recovery records.

## Contract rules

- Replace legacy /password-reset/request and /password-reset/confirm routes with the three routes above.
- Only successful OTP verification returns a resetToken.
- Route bodies are validated before controller execution.