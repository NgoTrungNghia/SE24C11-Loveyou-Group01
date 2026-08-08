# contracts/profile-wizard-api.md — API Contracts

### GET /api/users/me
- Returns `{ success: true, data: { profile } }` including `isProfileComplete`.

### PUT /api/users/me
- Accepts profile fields & `isProfileComplete: true` upon finishing Board 3.
