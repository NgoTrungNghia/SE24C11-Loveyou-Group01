# Tasks: Password Reset OTP

**Input**: Design documents from `/specs/002-password-reset-otp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/password-reset-api.md, quickstart.md

**Tests**: Integration tests are required because the specification mandates automated acceptance coverage for rate limits, generic errors, credential invalidation, and secrecy.

**Organization**: Tasks are grouped by independently testable user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after its stated dependencies.
- **[Story]**: User story traceability label.
- Every task includes an exact file path.

## Phase 1: Setup

**Purpose**: Add dependencies, configuration, and test tooling required by the OTP reset work.

- [X] T001 Add Nodemailer, Jest, and supertest dependencies plus a working test script in `loveyou-backend/package.json`.
- [X] T002 [P] Add `EMAIL_USER` and `EMAIL_APP_PASSWORD` handling without secret output in `loveyou-backend/src/config/index.js`.
- [X] T003 [P] Create a committed variable-name-only template in `loveyou-backend/.env.example` for `DATABASE_URL`, `JWT_SECRET`, `PORT`, `EMAIL_USER`, and `EMAIL_APP_PASSWORD`.
- [X] T004 Refactor server bootstrap so the Express app is importable by integration tests while listening remains in `loveyou-backend/index.js`.

---

## Phase 2: Foundational Prerequisites

**Purpose**: Establish persistence, rate limiting, and test infrastructure that block all recovery journeys.

- [X] T005 Extend `PasswordResetToken` with nullable reset-token fields and OTP hash, OTP expiry, verified, and attempt-count fields in `loveyou-backend/prisma/schema.prisma`.
- [X] T006 Create and apply the OTP reset migration under `loveyou-backend/prisma/migrations/`, then regenerate the client used by `loveyou-backend/src/utils/prismaClient.js`.
- [X] T007 [P] Implement normalized-email rolling-hour request tracking with a three-request limit in `loveyou-backend/src/services/resetRateLimiter.js`.
- [X] T008 [P] Create shared integration-test setup, database cleanup, and mocked mail transport utilities in `loveyou-backend/tests/helpers/authOtpReset.js`.

**Checkpoint**: Database lifecycle, rate-limit primitive, and test harness are ready. All user-story work may begin.

---

## Phase 3: User Story 1 - Request a reset code (Priority: P1) MVP

**Goal**: A person requests a six-digit reset code delivered by email without receiving a code, token, or account-existence signal in the response.

**Independent Test**: A registered test user receives a six-digit emailed OTP after a request; known, unknown, and rate-limited addresses receive the same confirmation shape; no response/log fixture exposes the code.

### Tests for User Story 1

- [X] T009 [P] [US1] Write failing request-flow integration cases for known/unknown emails, three-per-hour limiting, SMTP failure, and OTP secrecy in `loveyou-backend/tests/auth.otp-reset.integration.test.js`.

### Implementation for User Story 1

- [X] T010 [US1] Implement one reusable Gmail SMTP/App Password transport and sanitized reset-email delivery in `loveyou-backend/src/services/emailService.js`.
- [X] T011 [US1] Implement OTP generation with `crypto.randomInt`, bcrypt hashing, ten-minute expiry, replacement of earlier challenges, and delivery-failure invalidation in `loveyou-backend/src/services/authService.js`.
- [X] T012 [P] [US1] Add forgot-password email validation in `loveyou-backend/src/validation/authSchemas.js`.
- [X] T013 [US1] Add the generic `POST /api/auth/forgot-password` handler and delivery-failure envelope in `loveyou-backend/src/controllers/authController.js`.
- [X] T014 [US1] Replace the legacy request route with `POST /forgot-password` in `loveyou-backend/src/routes/authRoutes.js`.
- [X] T015 [US1] Replace token-copying UI with email submission, generic confirmation, and an OTP-entry transition in `loveyou-frontend/src/pages/ForgotPassword.jsx`.
- [X] T016 [US1] Point the forgot-password client call to the new route in `loveyou-frontend/src/utils/api.js`.
- [X] T017 [US1] Run and make the User Story 1 cases pass in `loveyou-backend/tests/auth.otp-reset.integration.test.js`.

**Checkpoint**: Requesting a reset code is independently demonstrable without returning an OTP or reset authorization.

---

## Phase 4: User Story 2 - Verify a reset code (Priority: P1)

**Goal**: A user who received a current code can exchange it for a single-use reset authorization; every invalid verification has one generic outcome.

**Independent Test**: A correct current code returns a ten-minute reset authorization; wrong, expired, unknown, and fifth-attempt-exhausted codes return the same generic failure and no authorization.

### Tests for User Story 2

- [X] T018 [P] [US2] Write failing verification integration cases for correct OTP, generic failures, expiry, and five-attempt invalidation in `loveyou-backend/tests/auth.otp-reset.integration.test.js`.

### Implementation for User Story 2

- [X] T019 [US2] Implement bcrypt OTP comparison, atomic attempt increments, five-attempt invalidation, verified state, and ten-minute reset-token issuance in `loveyou-backend/src/services/authService.js`.
- [X] T020 [P] [US2] Add email-plus-six-digit-OTP validation in `loveyou-backend/src/validation/authSchemas.js`.
- [X] T021 [US2] Add the generic `POST /api/auth/verify-otp` controller response in `loveyou-backend/src/controllers/authController.js`.
- [X] T022 [US2] Register `POST /verify-otp` in `loveyou-backend/src/routes/authRoutes.js`.
- [X] T023 [US2] Submit the entered code, retain only the returned reset authorization for the next step, and show generic failures in `loveyou-frontend/src/pages/ForgotPassword.jsx`.
- [X] T024 [US2] Add the verify-OTP client call in `loveyou-frontend/src/utils/api.js`.
- [X] T025 [US2] Run and make the User Story 2 cases pass in `loveyou-backend/tests/auth.otp-reset.integration.test.js`.

**Checkpoint**: OTP verification is independently demonstrable and never reveals whether an email or code was valid beyond the generic result.

---

## Phase 5: User Story 3 - Complete a password reset (Priority: P1)

**Goal**: A verified user changes their password with a valid reset authorization, and successful completion invalidates all recovery credentials for that user.

**Independent Test**: A verified authorization changes the password once; the new password works for login, and reused/expired authorizations plus all older OTPs fail.

### Tests for User Story 3

- [X] T026 [P] [US3] Write failing reset integration cases for valid reset, expired/reused authorization, unchanged password on failure, and deletion of all user recovery records in `loveyou-backend/tests/auth.otp-reset.integration.test.js`.

### Implementation for User Story 3

- [X] T027 [US3] Require verified state and unexpired reset authorization before password update, then delete all user recovery records after success in `loveyou-backend/src/services/authService.js`.
- [X] T028 [P] [US3] Rename and validate the reset-authorization request body in `loveyou-backend/src/validation/authSchemas.js`.
- [X] T029 [US3] Update the reset-password controller to return only the existing generic invalid-token outcome in `loveyou-backend/src/controllers/authController.js`.
- [X] T030 [US3] Replace the legacy confirmation route with `POST /reset-password` in `loveyou-backend/src/routes/authRoutes.js`.
- [X] T031 [US3] Update the final reset screen to submit the transient reset authorization and new password without displaying or persisting it in `loveyou-frontend/src/pages/ResetPassword.jsx`.
- [X] T032 [US3] Add the reset-password client call and remove legacy reset-route calls in `loveyou-frontend/src/utils/api.js`.
- [X] T033 [US3] Run and make the User Story 3 cases pass in `loveyou-backend/tests/auth.otp-reset.integration.test.js`.

**Checkpoint**: The entire password-recovery lifecycle is complete and all previously issued recovery credentials are unusable after reset.

---

## Phase 6: Polish and Cross-Cutting Validation

**Purpose**: Validate the completed feature against security, delivery, and user-facing contract requirements.

- [X] T034 [P] Verify environment files and all auth/email logging paths do not emit OTPs, reset authorizations, SMTP credentials, or email bodies in `loveyou-backend/.gitignore`, `loveyou-backend/src/config/index.js`, and `loveyou-backend/src/services/emailService.js`.
- [X] T035 [P] Remove obsolete password-reset request/confirm endpoint references from `loveyou-backend/src/routes/authRoutes.js`, `loveyou-frontend/src/utils/api.js`, and `loveyou-frontend/src/pages/`.
- [X] T036 Run backend tests, Prisma generation, and frontend production build using `loveyou-backend/package.json` and `loveyou-frontend/package.json`.
- [X] T037 Execute every positive and negative scenario in `specs/002-password-reset-otp/quickstart.md` and reconcile deviations with `specs/002-password-reset-otp/contracts/password-reset-api.md`.

---

## Dependencies and Execution Order

### Phase dependencies

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1 and blocks all story work.
- US1 depends on Phase 2.
- US2 depends on US1 because it verifies the OTP challenge created by US1.
- US3 depends on US2 because it consumes the verified authorization issued there.
- Phase 6 depends on the three stories.

### User story completion order

~~~text
Setup â†’ Foundational â†’ US1: Request OTP â†’ US2: Verify OTP â†’ US3: Reset password â†’ Polish
~~~

### Parallel opportunities

- T002 and T003 can run in parallel after T001 planning starts.
- T007 and T008 can run in parallel after Phase 1.
- Within US1, T012 can proceed while T010/T011 are built; frontend work T015/T016 starts after T013/T014 contract stabilization.
- Within US2, T020 can proceed while T019 is built; frontend work T023/T024 starts after T021/T022 contract stabilization.
- Within US3, T028 can proceed while T027 is built; frontend work T031/T032 starts after T029/T030 contract stabilization.
- T034 and T035 can run in parallel after all story tasks.

## Parallel Example: Foundational Phase

~~~text
Task: T007 Implement resetRateLimiter.js
Task: T008 Create tests/helpers/authOtpReset.js
~~~

## Implementation Strategy

### MVP first

1. Complete Phases 1 and 2.
2. Complete US1 through T017 and validate that no reset credential leaks.
3. Continue to US2 and US3 because a request-only recovery flow has no complete user value by itself.
4. Run Phase 6 before release.

### Incremental delivery

1. Request/email code safely (US1).
2. Verify code and issue the short-lived authorization (US2).
3. Reset password and invalidate recovery state (US3).
4. Validate all contract, security, and quickstart scenarios.

## Notes

- All tasks use the required checkbox, sequential ID, optional parallel marker, story label, and exact path format.
- The process-local limiter is an explicit single-instance tradeoff; do not silently treat it as distributed protection.
- Tests should use a mocked mail transport and must never assert by logging or returning OTP plaintext in production code.
