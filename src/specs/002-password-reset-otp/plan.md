# Implementation Plan: Password Reset OTP

**Branch**: `002-password-reset-otp` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-password-reset-otp/spec.md`

## Summary

Replace the testing-only reset-token response with a three-step recovery flow: request an emailed OTP, verify the OTP, then reset the password with a single-use authorization. Use Nodemailer with Gmail SMTP/App Password credentials, `crypto.randomInt` for OTP creation, bcrypt for OTP hashing, an extended Prisma `PasswordResetToken` record, and a process-local email-keyed rate-limit `Map`.

## Technical Context

**Language/Version**: Node.js 18+; CommonJS JavaScript

**Primary Dependencies**: Express 5, Prisma 7, PostgreSQL, bcrypt 6, Zod 4, Nodemailer (new production dependency); Jest and supertest (new test dependencies)

**Storage**: Neon-hosted PostgreSQL through Prisma; process memory for the per-email one-hour request limit

**Testing**: Jest with supertest integration tests and a mocked Nodemailer transport

**Target Platform**: Linux server/container and local Node.js development

**Project Type**: Full-stack web application with Express REST API and React/Vite SPA

**Performance Goals**: Accepted reset-email requests complete or return generic retryable delivery failure within 60 seconds; other OTP operations meet normal API latency expectations

**Constraints**: OTPs and reset authorizations never appear in production logs or reset-request responses; OTP and verified reset authorization each expire in 10 minutes; 3 requests/email/hour and 5 failed attempts/OTP; rate limiting is process-local for the current scale

**Scale/Scope**: Existing Authentication feature only. The in-memory limiter suits a small single-instance deployment but is not distributed across processes.

## Constitution Check

*GATE: Passed before Phase 0 research. Re-checked after Phase 1 design: passed.*

- **Security and Privacy by Default — PASS**: passwords and OTPs are bcrypt-hashed; secrets are environment-only; generic errors prevent enumeration; logs redact OTPs, reset authorizations, and SMTP credentials.
- **Architecture Discipline — PASS**: the plan keeps Express, Prisma, PostgreSQL, Zod, and React/Vite boundaries; only backend services communicate with persistence and SMTP.
- **Simplicity and Maintainability — PASS**: extends existing reset-token, controller, service, routes, and validation layers. A `Map` avoids unnecessary dependency/service complexity for declared scale.
- **Quality Through Validation and Review — PASS**: contract and integration scenarios cover changed authentication, persistence, rate limiting, delivery failures, and secrecy.
- **Prioritized Product Delivery — PASS**: scope improves Authentication only.

## Project Structure

### Documentation

~~~text
specs/002-password-reset-otp/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/password-reset-api.md
~~~

### Source Code

~~~text
loveyou-backend/
├── index.js                              # SMTP readiness without secret logging
├── package.json                          # Nodemailer and test dependencies/scripts
├── prisma/schema.prisma                  # extend PasswordResetToken
├── src/
│   ├── config/index.js                   # EMAIL_USER and EMAIL_APP_PASSWORD
│   ├── controllers/authController.js     # request OTP, verify OTP, reset handlers
│   ├── routes/authRoutes.js              # three password-reset routes
│   ├── services/authService.js            # OTP lifecycle and password reset
│   ├── services/emailService.js           # reusable Gmail SMTP transport
│   ├── services/resetRateLimiter.js       # rolling-hour email-keyed Map
│   └── validation/authSchemas.js          # request/verify/reset schemas
└── tests/auth.otp-reset.integration.test.js

loveyou-frontend/src/pages/               # adapt forgot/reset screens to three steps
~~~

**Structure Decision**: Keep the existing full-stack split. Backend additions remain in the existing auth service/controller/route/validation layers; email and rate limiting are focused services. The frontend calls only backend endpoints and holds the reset authorization transiently for the final step.

## Complexity Tracking

No constitution violations or additional complexity justifications are required.