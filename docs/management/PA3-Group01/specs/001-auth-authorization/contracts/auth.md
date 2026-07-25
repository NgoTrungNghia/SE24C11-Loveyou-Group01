# contracts/auth.md — API & UI Contracts

## Backend API Contracts

### POST /api/auth/signup
- **Request body**: `{ username, email, password, phone? }`
- **Response (201)**: `{ success: true, data: { user: { userId, username, email, phoneNumber, role, status, createdAt } } }`
- **Errors**:
  - `400`: validation error `{ success: false, error: { message, code: "VALIDATION_ERROR", field, issues[] } }`
  - `409`: duplicate field `{ success: false, error: { message, code: "DUPLICATE_FIELD", field: "email"|"username" } }`

### POST /api/auth/login
- **Request body**: `{ email, password }`
- **Response (200)**: `{ success: true, data: { token: "<jwt>", expiresAt: "<iso>" } }`
- **JWT payload**: `{ userId, role, iat, exp }`
- **Errors**:
  - `400`: validation error
  - `401`: `{ success: false, error: { message: "Invalid credentials", code: "INVALID_CREDENTIALS" } }`

### POST /api/auth/logout
- **Request**: `Authorization: Bearer <token>`
- **Response (200)**: `{ success: true, data: { message: "Logged out" } }`
- **Note**: Client is responsible for discarding the token. No server-side blacklist.

### POST /api/auth/password-reset/request
- **Request body**: `{ email }`
- **Response (200)**: `{ success: true, data: { resetToken: "<token>", expiresAt: "<iso>" } }`
- **Note**: Token returned in response for testing (no email service in this iteration).
  If email not found, responds `200` with generic message to avoid account enumeration.

### POST /api/auth/password-reset/confirm
- **Request body**: `{ token, newPassword }`
- **Response (200)**: `{ success: true, data: { message: "Password updated" } }`
- **Errors**:
  - `400`: validation error
  - `401`: `{ success: false, error: { message: "Invalid or expired token", code: "INVALID_TOKEN" } }`

### GET /api/admin/stats *(RBAC demo)*
- **Requires**: `Authorization: Bearer <token>` with `role: ADMIN`
- **Response (200)**: `{ success: true, data: { stats: { ... } } }`
- **Errors**:
  - `401`: missing or invalid token
  - `403`: token valid but role is USER (not ADMIN)

---

## Frontend UI Contracts

### Pages & Routes

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/login` | Login | Guest only | Email + password form. Redirects to `/dashboard` on success. |
| `/signup` | Signup | Guest only | Username + email + password + phone(optional). Redirects to `/login` on success. |
| `/forgot-password` | ForgotPassword | Guest only | Email form → receives reset token → copy + navigate to reset page. |
| `/reset-password` | ResetPassword | Public | Token + new password + confirm. Auto-fills token from navigation state. |
| `/dashboard` | Dashboard | Protected (JWT required) | Shows user info, stats, RBAC demo panel. |

### AuthContext State Shape
```js
{
  user:    { userId, role, iat, exp } | null,  // decoded JWT payload
  token:   "<jwt>" | null,                      // raw JWT string
  loading: boolean,
  login:   async (email, password) => { ok, expiresAt?, message?, issues? },
  logout:  async () => void,
  isAdmin: boolean,
}
```

### Error Display Contract
- **Field-level errors**: shown inline below the input field (red text)
- **Generic errors**: shown as alert banner at top of form
- **API `issues[]` array**: mapped to field-level errors by `field` property
- **Network error**: falls back to generic "Login failed" / "Sign up failed"

### Session Persistence
- JWT stored in `localStorage` under key `ly_token`
- On app load: token decoded, expiry checked — expired tokens auto-cleared
- On logout: token removed from `localStorage` + state reset
