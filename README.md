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
- [Implemented Features (FG-01)](#implemented-features-fg-01)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 18+, Express 5 |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` |
| **Database** | PostgreSQL (Neon cloud) |
| **Auth** | JWT (7-day expiry) + bcrypt (10 rounds) |
| **Email** | Nodemailer (Gmail SMTP / App Password) |
| **Validation** | Zod v4 |
| **Testing** | Jest + supertest |
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
│   │   ├── 001-auth-authorization/
│   │   └── 002-password-reset-otp/
│   │
│   ├── loveyou-backend/            # Express REST API (port 3000)
│   │   ├── index.js                # Server entry point (listen only)
│   │   ├── .env.example            # Required env var names (no secrets)
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── migrations/         # Migration history
│   │   ├── tests/                  # Integration tests (OTP reset)
│   │   └── src/
│   │       ├── app.js              # Express app (importable by tests)
│   │       ├── controllers/        # Request handlers
│   │       ├── services/           # Auth, email, rate limiting
│   │       ├── middlewares/        # Auth, validation, error handling
│   │       ├── routes/             # Express routes
│   │       ├── utils/              # Helpers (JWT, bcrypt, Prisma)
│   │       ├── config/             # Env loading
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
- A Gmail account with [App Password](https://myaccount.google.com/apppasswords) (2-Step Verification required) for OTP email delivery

### 1. Clone & setup Backend

```bash
cd src/loveyou-backend
npm install
```

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

`src/loveyou-backend/.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/neondb?sslmode=require
JWT_SECRET=your-super-secret-key
PORT=3000
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=your-16-char-app-password
```

> **Important:** Never commit `.env`. After changing `.env`, **restart** the backend — Node only loads env vars at startup.

Apply database migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start backend:

```bash
npm run dev
# → http://localhost:3000
```

Run backend tests:

```bash
npm test
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
| `POST` | `/auth/forgot-password` | — | Send 6-digit OTP to a **registered** email |
| `POST` | `/auth/verify-otp` | — | Verify OTP → receive short-lived reset authorization |
| `POST` | `/auth/reset-password` | — | Set new password with reset authorization |
| `GET` | `/admin/stats` | Bearer (ADMIN) | RBAC demo — admin only |

### Password reset flow

1. **Forgot password** — `POST /auth/forgot-password` with `{ "email" }`  
   - Registered email → OTP emailed (valid 10 minutes), max 3 requests/email/hour  
   - Unregistered email → `404 EMAIL_NOT_REGISTERED`  
   - Response never includes the OTP
2. **Verify OTP** — `POST /auth/verify-otp` with `{ "email", "otp" }`  
   - Success → `{ resetToken, expiresAt }` (10 minutes, single-use)  
   - Wrong / expired / 5 failed attempts → generic `401 INVALID_OTP`
3. **Reset password** — `POST /auth/reset-password` with `{ "resetToken", "newPassword" }`  
   - Success → password updated; all recovery records for that user deleted

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

### Example: Forgot password (OTP)
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com"}'
# → { "success": true, "data": { "message": "A reset code was sent to your email" } }
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

This work was driven by [Spec Kit](https://speckit.dev) following the spec-driven workflow:

| Feature | Spec folder |
|---------|-------------|
| Auth & authorization | [`src/specs/001-auth-authorization/`](./src/specs/001-auth-authorization/) |
| Password reset OTP | [`src/specs/002-password-reset-otp/`](./src/specs/002-password-reset-otp/) |

Typical Spec Kit steps: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`

---

## Implemented Features (FG-01)

- ✅ **Sign up** — username, email, password, optional phone
- ✅ **Login** — returns JWT with 7-day expiry
- ✅ **Logout** — client-side token discard
- ✅ **Forgot password (OTP)** — emailed 6-digit code for registered accounts only
- ✅ **Verify OTP** — issues a 10-minute single-use reset authorization
- ✅ **Reset password** — bcrypt hash update + invalidation of all recovery credentials
- ✅ **Email delivery** — Nodemailer + Gmail App Password (`EMAIL_USER` / `EMAIL_APP_PASSWORD`)
- ✅ **Rate limits** — 3 OTP requests/email/hour; 5 failed OTP attempts per code
- ✅ **Session management** — JWT auto-restored from localStorage
- ✅ **Role-based access control** — USER vs ADMIN, 403 on insufficient role
- ✅ **Field-level validation errors** — user-friendly messages, no raw JSON

---

## Submission Notes

> Before submitting, remove generated directories:
> ```bash
> Remove-Item src\loveyou-backend\node_modules -Recurse -Force
> Remove-Item src\loveyou-frontend\node_modules -Recurse -Force
> ```
