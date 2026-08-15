---
description: "Generated tasks for Authentication & Authorization feature"
---

# Tasks: Authentication & Authorization

**Input**: Design documents from `/src/specs/001-auth-authorization/`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialize Node.js project and package.json at src/package.json
- [x] T002 Install dependencies: express, prisma, @prisma/client, bcrypt, jsonwebtoken, zod, dotenv, pg, @prisma/adapter-pg (project root)
- [x] T003 [P] Create folders: src/routes, src/controllers, src/services, src/middlewares, src/utils, prisma, tests
- [x] T004 Add `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `PORT` at src/.env.example
- [x] T005 [P] Add basic server entry `index.js` that loads env, sets up CORS, and starts Express

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T006 Setup Prisma schema update: add `PasswordResetToken` model and ensure `User` has `@unique` on email/username in prisma/schema.prisma
- [x] T007 Run `npx prisma generate` and create initial migration (prisma/migrations) from prisma/schema.prisma
- [x] T008 [P] Create `src/utils/prismaClient.js` exporting a Prisma client instance (using PrismaPg driver adapter for Prisma 7)
- [x] T009 [P] Create `src/utils/token.js` with helpers: `createAccessToken(payload)`, `verifyAccessToken(token)` using `JWT_SECRET` and 7d expiry
- [x] T010 [P] Create `src/utils/password.js` with `hashPassword(password)` and `comparePassword(password, hash)` using bcrypt (10 rounds)
- [x] T011 Implement centralized error handler middleware `src/middlewares/errorHandler.js` returning `{ success:false, error:{message,code}}`
- [x] T012 Implement validation middleware `src/middlewares/validationMiddleware.js` to run zod schemas and return 400 on validation errors (using safeParse + issues array)
- [x] T013 Implement auth middleware `src/middlewares/authMiddleware.js` to verify JWT and attach `req.user` (401 if missing/invalid)
- [x] T014 Implement role-check middleware `src/middlewares/roleMiddleware.js` to enforce ADMIN-only routes (403 on insufficient role)
- [x] T015 [P] Create `src/controllers/baseController.js` helper for consistent responses `{ success:true, data }`
- [x] T016 Create `src/services/authService.js` with functions: `createUser`, `findByEmail`, `findByUsername`, `verifyCredentials`, `createResetToken`, `verifyResetToken`, `resetPassword`
- [x] T017 Create `src/routes/authRoutes.js` skeleton and wire to `index.js`
- [x] T018 Add request zod schemas in `src/validation/authSchemas.js` (signup, login, reset request, reset confirm) with user-friendly messages
- [x] T019 Add environment config loader `src/config/index.js` reading `process.env` with validation

---

## Phase 3: User Story 1 - Create account and sign in (Priority: P1) 🎯

**Goal**: Allow users to sign up with unique username/email and sign in to receive a 7-day JWT.

**Independent Test**: Sign-up then sign-in returns a usable JWT (can access a protected route). ✅ VERIFIED

- [x] T020 [P] [US1] Implement `POST /api/auth/signup` in `src/controllers/authController.js` and route in `src/routes/authRoutes.js` (create user, return user without password)
- [x] T021 [US1] Enforce password length >=6 and uniqueness checks; return 409 with field info on duplicate (src/services/authService.js + src/controllers/authController.js)
- [x] T022 [P] [US1] Implement `POST /api/auth/login` (validate credentials, return `{ token, expiresAt }`) in `src/controllers/authController.js`
- [x] T023 [US1] Implement `POST /api/auth/logout` route that returns `{ success:true, data:{message:'Logged out'} }` (client discards token) in `src/routes/authRoutes.js`
- [ ] T024 [US1] Add integration test `tests/integration/auth_signup_login.test.js` validating sign-up, login, and token usage against a test DB
- [ ] T025 [US1] Add unit tests for `authService.verifyCredentials` and password utils in `tests/unit/`

---

## Phase 4: User Story 2 - Reset a forgotten password (Priority: P2)

**Goal**: Allow a user to request a reset token and complete password reset using a 15-minute token.

**Independent Test**: Request token (returned in response), confirm with new password, sign in with new password. ✅ VERIFIED

- [x] T026 [P] [US2] Implement `POST /api/auth/password-reset/request` (generate secure token, persist `PasswordResetToken` with expiresAt = now+15m, return token)
- [x] T027 [US2] Implement `POST /api/auth/password-reset/confirm` (verify token, update password hash, delete tokens)
- [ ] T028 [US2] Add integration tests `tests/integration/auth_password_reset.test.js` covering request + confirm + login with new password
- [ ] T029 [US2] Add unit tests for reset token generation and verification in `tests/unit/`

---

## Phase 5: User Story 3 - Access protected routes safely (Priority: P2)

**Goal**: Protect endpoints with JWT; enforce ADMIN-only routes.

**Independent Test**: No token → 401; USER token on admin route → 403; ADMIN token → 200. ✅ VERIFIED

- [x] T030 [P] [US3] Implement `src/middlewares/authMiddleware.js` verification (attach `req.user`) and apply to protected routes
- [x] T031 [US3] Implement `src/middlewares/roleMiddleware.js` and create admin route `src/routes/adminRoutes.js` with `GET /api/admin/stats`
- [ ] T032 [US3] Add integration tests `tests/integration/auth_protected.test.js` verifying 401/403/200 cases

---

## Phase 6: Frontend (Full-stack requirement)

- [x] T033-FE Create React (Vite) frontend at `loveyou-frontend/`
- [x] T034-FE Implement Login page (`/login`) with email/password form and field-level error display
- [x] T035-FE Implement Signup page (`/signup`) with username/email/password/phone form
- [x] T036-FE Implement Forgot Password page (`/forgot-password`) — requests token, displays it for testing
- [x] T037-FE Implement Reset Password page (`/reset-password`) — token + new password form
- [x] T038-FE Implement Dashboard page (`/dashboard`) — protected route with RBAC demo panel
- [x] T039-FE Implement AuthContext with JWT decode, session restore from localStorage, login/logout
- [x] T040-FE Implement ProtectedRoute and GuestRoute guards

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T041 [P] Documentation: update `specs/001-auth-authorization/quickstart.md` with curl examples and environment notes
- [x] T042 Validation error messages: human-readable messages for all Zod validation errors (field-level, not raw JSON)
- [ ] T043 [P] Add linting/formatting scripts and run `npm run format` across changed files
- [ ] T044 [P] Add Postman collection or OpenAPI snippets for the auth endpoints in `docs/`
- [ ] T045 Security: Review secrets handling and rotate `JWT_SECRET` guidance in README

---

## Dependencies & Execution Order

- Phase 1 (Setup) T001-T005: completed
- Phase 2 (Foundational) T006-T019: completed — unblocked all user stories
- User Stories (Phase 3-5) T020-T031: completed (core logic); tests T024-T025, T028-T029, T032 deferred
- Frontend (Phase 6) T033-T040: completed
- Polish T041-T045: partially complete

## Implementation Notes

- **Prisma 7 driver adapter**: `PrismaPg` adapter required — `new PrismaClient({ adapter })` instead of bare constructor
- **Zod v4 issues**: Use `safeParse()` + `result.error.issues` (not `.errors`) for validation errors
- **Foreign key via relation**: `passwordResetToken.create` uses `user: { connect: { userId } }` instead of scalar `userId` field
- **CORS**: Backend configured to allow `http://localhost:5173` (Vite dev server)
