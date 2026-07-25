# Implementation Plan: Authentication & Authorization

**Branch**: `001-auth-authorization` | **Date**: 2026-07-24 | **Spec**: src/specs/001-auth-authorization/spec.md

**Input**: Feature specification from `/src/specs/001-auth-authorization/spec.md`

**Note**: Filled by the speckit.plan workflow.

## Summary

Implement the Authentication & Authorization feature for LoveYou using a Node.js + Express backend with Prisma ORM targeting PostgreSQL. The implementation will provide sign-up, login (JWT 7-day access tokens), logout (client-side discard), password reset with short-lived tokens (15 minutes), and role-based access control (USER vs ADMIN). Passwords will be hashed with bcrypt (10 salt rounds). Request validation will use zod. Centralized error-handling middleware will ensure consistent JSON envelope responses.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 18+ (LTS recommended)

**Primary Dependencies**: Express, Prisma (with postgres connector), bcrypt (10 salt rounds), jsonwebtoken, zod, dotenv, pg

**Storage**: PostgreSQL (hosted on Neon)

**Testing**: Jest + supertest for integration tests (recommended)

**Target Platform**: Linux server / container (deployable to cloud providers)

**Project Type**: Web service (REST API)

**Performance Goals**: Typical REST API throughput for user auth; no special high-throughput constraints for this iteration

**Constraints**: Keep implementation simple and readable; follow Constitution for security and API contract

**Scale/Scope**: Support initial user base and admin users; design for typical web app scale (thousands of users)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Authentication and password handling MUST use bcrypt and JWT-based access tokens with a 7-day expiry.
- Backend implementation MUST use Node.js, Express, Prisma ORM, and PostgreSQL unless an exception is explicitly approved.
- API contracts MUST follow RESTful route naming and return JSON envelopes with success/data or error.
- Code comments and documentation MUST be written in English, and implementation choices MUST favor simplicity and readability.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: Full-stack web application with separate backend and frontend projects:

```text
loveyou-backend/                  ← Express REST API
├── index.js                      ← Server entry point (CORS, routes)
├── prisma/
│   ├── schema.prisma             ← User + PasswordResetToken models
│   └── migrations/               ← DB migration history
├── src/
│   ├── config/index.js           ← Env config loader
│   ├── controllers/
│   │   ├── authController.js     ← signup, login, logout, reset
│   │   └── baseController.js     ← { success, data } response helper
│   ├── middlewares/
│   │   ├── authMiddleware.js     ← JWT verification → req.user
│   │   ├── roleMiddleware.js     ← RBAC enforcement (403 on role mismatch)
│   │   ├── validationMiddleware.js ← Zod safeParse → field-level errors
│   │   └── errorHandler.js       ← Centralized error → JSON envelope
│   ├── routes/
│   │   ├── authRoutes.js         ← /api/auth/* endpoints
│   │   └── adminRoutes.js        ← /api/admin/* (ADMIN only)
│   ├── services/
│   │   └── authService.js        ← DB operations, token logic
│   ├── utils/
│   │   ├── prismaClient.js       ← PrismaPg adapter instance
│   │   ├── token.js              ← createAccessToken / verifyAccessToken
│   │   └── password.js           ← hashPassword / comparePassword
│   └── validation/
│       └── authSchemas.js        ← Zod schemas with custom messages

loveyou-frontend/                 ← React 18 + Vite SPA
├── index.html
├── src/
│   ├── main.jsx                  ← React entry point
│   ├── App.jsx                   ← BrowserRouter + all routes
│   ├── index.css                 ← Global design system (dark mode, glassmorphism)
│   ├── components/
│   │   └── shared.jsx            ← AuthLayout, Brand, Field, ProtectedRoute, GuestRoute
│   ├── context/
│   │   └── AuthContext.jsx       ← Global auth state, login/logout, JWT decode
│   ├── pages/
│   │   ├── Login.jsx             ← /login
│   │   ├── Signup.jsx            ← /signup
│   │   ├── ForgotPassword.jsx    ← /forgot-password
│   │   ├── ResetPassword.jsx     ← /reset-password
│   │   └── Dashboard.jsx         ← /dashboard (protected)
│   └── utils/
│       └── api.js                ← Axios instance + auth interceptor
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
