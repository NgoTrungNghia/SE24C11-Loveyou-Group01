# Feature Specification: Smart Matching & Swiping Deck (004)

**Feature Branch**: `004-matching`  
**Created**: 2026-08-07 (Updated: 2026-08-18)  
**Status**: Completed / Enhanced  

---

## 1. Overview & Context
Authenticated users can browse a Tinder-style swipe candidate deck, perform actions (`LIKE`, `PASS`, `SUPER_LIKE`), receive instant mutual match alerts, view active matches, unmatch partners safely, and reset candidate suggestions when the deck is exhausted.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 — Swipe Candidate Deck (Priority: P1)
Authenticated user opens the swiping deck and sees candidate cards showing photo, display name, age, city/location, bio, verified badge, and interest tags.

### User Story 2 — Swiping Actions & Mutual Match (Priority: P1)
User clicks LIKE or SUPER_LIKE on a candidate. If the target candidate has also liked the current user, a mutual match is created in the database and a match pop-up alert appears.

### User Story 3 — Matches Queue (Priority: P1)
User views their mutual matches list in the left sidebar showing candidate photo, name, age, match time, and verification badges.

### User Story 4 — Safe Unmatch (Soft Delete) (Priority: P1)
User can unmatch a partner. The match status is set to `isUnmatched = true`, keeping conversation history for safety/audit while disabling new messages. Swipes are cleared so users can rematch later if desired.

### User Story 5 — Reset Suggestions Deck on Empty (Priority: P1)
When all available candidate profiles in the database have been swiped, an "Hết hồ sơ gợi ý rồi!" screen appears. Clicking "🔄 Tải lại" calls `POST /api/matching/reset-candidates`, deleting previous un-matched swipes while preserving active matches and blocked users, reloading recommendations from the beginning.

### User Story 6 — Who Liked Me & Who I Liked (Priority: P2)
Users can view who liked them (`GET /api/matching/who-liked-me`) and who they liked (`GET /api/matching/who-i-liked`). Non-VIP users see a blurred count; VIP users view full profiles.

---

## 3. Requirements

- **FR-004-1**: System MUST record user swipes (`LIKE`, `PASS`, `SUPER_LIKE`) in database.
- **FR-004-2**: System MUST automatically create a `Match` record when mutual likes occur.
- **FR-004-3**: System MUST exclude already-swiped users, active matches, and blocked users from candidates deck.
- **FR-004-4**: System MUST provide API `POST /api/matching/reset-candidates` to clear non-matched swipes and restore candidate suggestions.
- **FR-004-5**: System MUST provide API `POST /api/matching/unmatch` with soft-delete flag (`isUnmatched: true`).
- **FR-004-6**: System MUST provide endpoints `GET /api/matching/candidates`, `POST /api/matching/swipe`, `GET /api/matching/matches`, `GET /api/matching/who-liked-me`, `GET /api/matching/who-i-liked`.
