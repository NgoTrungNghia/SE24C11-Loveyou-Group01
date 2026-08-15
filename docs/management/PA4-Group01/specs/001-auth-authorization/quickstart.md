# quickstart.md — Authentication & Authorization

## Prerequisites
- Node.js 18+
- PostgreSQL (Neon) connection string
- Two terminal windows (backend + frontend)

## Project Structure

```
SE24C11-Loveyou-Group01/
└── src/
    ├── loveyou-backend/  ← Express API (port 3000)
    └── loveyou-frontend/ ← React UI (port 5173)
```

## Backend Setup

```bash
cd src/loveyou-backend
npm install
```

Create `.env`:
```
DATABASE_URL=postgresql://...your neon connection string...
JWT_SECRET=your-secret
PORT=3000
```

Run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

Start backend:
```bash
npm run dev   # → http://localhost:3000
```

## Frontend Setup

```bash
cd src/loveyou-frontend
npm install
npm run dev   # → http://localhost:5173
```

Open **http://localhost:5173** in browser.

---

## API Quick Validation (curl)

**Health check:**
```bash
curl http://localhost:3000/api/health
```

**Sign up:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"secret123"}'
```

**Login → get JWT:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

**Access protected route (use token from login):**
```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer <token>"
# → 403 for USER role, 200 for ADMIN role
```

**Request password reset token:**
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com"}'
# → Returns resetToken in response (no email service in this iteration)
```

**Confirm password reset:**
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"token":"<resetToken>","newPassword":"newSecret123"}'
```

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>"
# → Client discards token (no server-side blacklist in this iteration)
```
