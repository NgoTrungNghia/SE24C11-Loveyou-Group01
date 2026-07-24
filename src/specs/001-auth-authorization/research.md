# research.md

## Decisions

### Backend
- **Runtime**: Node.js 18+ + Express 5
  - Rationale: Matches LoveYou constitution and existing stack; widespread tooling and community support.

- **ORM & Database**: Prisma 7 with PostgreSQL (Neon) via `@prisma/adapter-pg` driver adapter
  - Rationale: Prisma is already used in the repo; Neon-hosted Postgres is the chosen provider per input.
  - Note: Prisma 7 requires explicit driver adapter (`PrismaPg`) — bare `new PrismaClient()` no longer works.

- **Password hashing**: bcrypt with 10 salt rounds
  - Rationale: bcrypt is industry-standard for password hashing; 10 rounds balances security and CPU cost.

- **Authentication**: JWT using `jsonwebtoken`, secret from `JWT_SECRET`, 7-day expiry
  - Rationale: JWTs satisfy requirement for stateless access tokens; 7-day expiry defined in spec.

- **Validation**: `zod` v4 for schema validation
  - Rationale: Lightweight, composes well with request validation middleware.
  - Note: Zod v4 uses `safeParse()` + `result.error.issues` (not `.errors`) — breaking change from v3.

- **Reset tokens**: short-lived (15 minutes) tokens stored in DB (PasswordResetToken) tied to user
  - Rationale: Keeps flow testable without an email service; storing token allows expiry checks.

- **Error handling**: centralized `errorHandler` middleware producing JSON envelope:
  `{ success: false, error: { message, code, field?, issues[] } }`
  - `issues[]` array allows frontend to highlight specific input fields.

- **CORS**: configured to allow `http://localhost:5173` (Vite dev server) with credentials.

### Frontend
- **Framework**: React 18 + Vite 8
  - Rationale: Fast dev server, lightweight, ideal for SPA with multiple auth pages.

- **Routing**: React Router DOM v7 (BrowserRouter)
  - Rationale: Standard client-side routing; supports protected/guest route guards.

- **HTTP Client**: Axios with request interceptor
  - Rationale: Automatic JWT injection via interceptor; cleaner error handling than fetch.

- **State Management**: React Context API (`AuthContext`)
  - Rationale: Auth state is global and simple — no need for Redux/Zustand at this scale.

- **Session Persistence**: JWT stored in `localStorage`; decoded client-side to read `userId` and `role`.

- **Styling**: Vanilla CSS (custom design system)
  - Rationale: Full control over UI; no framework overhead. Dark mode glassmorphism theme.

- **Font**: Google Fonts — Inter (UI) + Playfair Display (brand)

## Alternatives Considered

- `express-validator` was considered but `zod` preferred for composability and clearer schemas.
- Server-side token blacklist was considered for logout but rejected (spec allows client-side discard only).
- Redux/Zustand considered for state management but rejected — AuthContext sufficient for auth-only state.
- Next.js considered for frontend but rejected — plain Vite simpler and no SSR needed for auth pages.

## Open Questions (none)

All required clarifications were provided in the spec. No unresolved NEEDS CLARIFICATION remain.
