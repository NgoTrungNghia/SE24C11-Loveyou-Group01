# Feature Specification: Smart Matching & Swiping Deck (004)

**Feature Branch**: `004-matching`

**Created**: 2026-08-07

**Status**: Completed

**Input**: User description: "Implement FG-04 Smart Matching & Swiping Deck feature group for LoveYou platform. Authenticated users can browse a Tinder-style swipe candidate deck, perform actions (LIKE, PASS, SUPER_LIKE), receive instant mutual match alerts ('IT'S A MATCH!'), and view their active matches list."

## User Scenarios & Acceptance Criteria

### User Story 1 - Swipe Candidate Deck (Priority: P1)
Authenticated user opens the swiping deck and sees candidate cards showing photo, display name, age, city/location, bio, and interest tags.

### User Story 2 - Swiping Actions & Mutual Match (Priority: P1)
User clicks LIKE or SUPER_LIKE on a candidate. If the target candidate has also liked the current user, a mutual match is created in the database and a match pop-up alert appears.

### User Story 3 - Matches Queue (Priority: P1)
User views their mutual matches list in the left sidebar showing candidate photo, name, age, and match time.

## Requirements

- **FR-01**: System MUST record user swipes (`LIKE`, `PASS`, `SUPER_LIKE`) in database.
- **FR-02**: System MUST automatically create a `Match` record when mutual likes occur.
- **FR-03**: System MUST exclude already-swiped users from the candidates deck.
- **FR-04**: System MUST provide API endpoints `GET /api/matching/candidates`, `POST /api/matching/swipe`, `GET /api/matching/matches`.
