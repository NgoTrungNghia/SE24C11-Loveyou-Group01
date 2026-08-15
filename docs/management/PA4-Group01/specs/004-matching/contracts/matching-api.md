# contracts/matching-api.md — Matching API Specifications

### GET /api/matching/candidates
- Returns `{ success: true, data: { candidates: [...] } }`

### POST /api/matching/swipe
- Body: `{ targetId: number, action: 'LIKE' | 'PASS' | 'SUPER_LIKE' }`
- Response: `{ success: true, data: { isMatch: boolean, matchedUser: object|null } }`

### GET /api/matching/matches
- Returns `{ success: true, data: { matches: [...] } }`
