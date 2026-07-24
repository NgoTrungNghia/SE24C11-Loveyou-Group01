# LoveYou 💝

> A modern dating platform — find your perfect match.
>
> **SE24C11 — Group 01** | Functional Group: **FG-01 Authentication & Authorization**

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Spec Kit Artifacts](#spec-kit-artifacts)
- [Team](#team)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 18+, Express 5 |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` |
| **Database** | PostgreSQL (Neon cloud) |
| **Auth** | JWT (7-day expiry) + bcrypt (10 rounds) |
| **Validation** | Zod v4 |
| **Frontend** | React 18 + Vite 8 |
| **Routing** | React Router DOM v7 |
| **HTTP Client** | Axios |

---

## Project Structure

```
SE24C11-Loveyou-Group01/
│
├── src/                            # Project workspace root for Spec Kit + apps
│   ├── .specify/                   # Spec Kit configuration and templates
│   ├── specs/                      # Feature specifications (FG-01)
│   │   └── 001-auth-authorization/
│   │       ├── spec.md             # Feature specification
│   │       ├── plan.md             # Implementation plan
│   │       ├── tasks.md            # Task breakdown
│   │       ├── research.md         # Tech decisions
│   │       ├── data-model.md       # Database schema design
│   │       ├── quickstart.md       # Setup guide
│   │       ├── contracts/auth.md   # API + UI contracts
│   │       └── checklists/         # Quality checklists
│   │
│   ├── loveyou-backend/            # Express REST API (port 3000)
│   │   ├── index.js                # Server entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── migrations/         # Migration history
│   │   └── src/
│   │       ├── controllers/        # Request handlers
│   │       ├── services/           # Business logic
│   │       ├── middlewares/        # Auth, validation, error handling
│   │       ├── routes/             # Express routes
│   │       ├── utils/              # Helpers (JWT, bcrypt, Prisma)
│   │       └── validation/         # Zod schemas
│   │
│   └── loveyou-frontend/           # React SPA (port 5173)
│       └── src/
│           ├── pages/              # Login, Signup, ForgotPassword, ResetPassword, Dashboard
│           ├── components/         # Shared UI components
│           ├── context/            # AuthContext (global auth state)
│           └── utils/              # Axios API client
│
├── docs/                           # Course documentation
└── README.md                       # Project overview
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database

### 1. Clone & setup Backend

```bash
cd src/loveyou-backend
npm install
```

Create `src/loveyou-backend/.env`:
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/neondb?sslmode=require
JWT_SECRET=your-super-secret-key
PORT=3000
```

Run database migration:
```bash
npx prisma migrate dev --name init
```

Start backend:
```bash
npm run dev
# → http://localhost:3000
```

### 2. Setup Frontend

```bash
cd src/loveyou-frontend
npm install
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## API Reference

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/signup` | — | Register new account |
| `POST` | `/auth/login` | — | Login → receive JWT |
| `POST` | `/auth/logout` | Bearer | Logout (client discards token) |
| `POST` | `/auth/password-reset/request` | — | Request password reset token |
| `POST` | `/auth/password-reset/confirm` | — | Confirm reset with token |
| `GET` | `/admin/stats` | Bearer (ADMIN) | RBAC demo — admin only |

### Example: Sign up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"secret123"}'
```

### Example: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
# → { "success": true, "data": { "token": "<jwt>", "expiresAt": "..." } }
```

### Response Format
All responses follow a consistent JSON envelope:
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "...", "code": "...", "field": "..." } }
```

---

## Spec Kit Artifacts

This feature was driven by [Spec Kit](https://speckit.dev) following the spec-driven workflow:

| Step | Command | Output |
|------|---------|--------|
| 1. Write spec | `/speckit.specify` | `src/specs/001-auth-authorization/spec.md` |
| 2. Plan | `/speckit.plan` | `src/specs/001-auth-authorization/plan.md`, `src/specs/001-auth-authorization/data-model.md`, `src/specs/001-auth-authorization/contracts/`, `src/specs/001-auth-authorization/research.md` |
| 3. Break down tasks | `/speckit.tasks` | `src/specs/001-auth-authorization/tasks.md` |
| 4. Implement | `/speckit.implement` | Source code |

All artifacts are in [`src/specs/001-auth-authorization/`](./src/specs/001-auth-authorization/).

---

## Implemented Features (FG-01)

- ✅ **Sign up** — username, email, password, optional phone
- ✅ **Login** — returns JWT with 7-day expiry
- ✅ **Logout** — client-side token discard
- ✅ **Forgot password** — request reset token (returned in response for testing)
- ✅ **Reset password** — token validation + bcrypt hash update
- ✅ **Session management** — JWT auto-restored from localStorage
- ✅ **Role-based access control** — USER vs ADMIN, 403 on insufficient role
- ✅ **Field-level validation errors** — user-friendly messages, no raw JSON

---

## Submission Notes

> Before submitting, remove generated directories:
> ```bash
> Remove-Item loveyou-backend\node_modules -Recurse -Force
> Remove-Item loveyou-frontend\node_modules -Recurse -Force
> ```
