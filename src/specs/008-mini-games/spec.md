# Feature Specification: Interactive Mini-Games for Matched Couples (008)

**Feature Branch**: `008-mini-games`

**Created**: 2026-08-12

**Status**: Completed

**Input**: User description: "Implement interactive realtime mini-games between matched couples ('Would You Rather?', 'Spin the Bottle', 'Guess Interests') to break the ice and increase engagement."

## User Scenarios & Acceptance Criteria

### User Story 1 - Invite Partner to Mini-Game (Priority: P1)
Either matched partner can click "🎮 Chơi game" in the chat panel to select a mini-game type and invite their partner. The partner receives a realtime toast notification popup.

### User Story 2 - Realtime Interactive Gameplay (Priority: P1)
When the partner accepts, both players transition to the `GameModal` overlay. As questions are answered, Socket.io broadcasts progress (`game_answer_received`, `game_both_answered`) in realtime without requiring page reloads.

### User Story 3 - Compatibility Score & Summary Screen (Priority: P1)
Upon completion, the game computes a final compatibility score (e.g., 80% matching answers in Would You Rather) and presents a summary screen with option to replay or return to chat.

## Requirements

- **FR-01**: System MUST support 3 game types (`WOULD_YOU_RATHER`, `SPIN_THE_BOTTLE`, `GUESS_INTERESTS`).
- **FR-02**: System MUST manage active game sessions with unique session IDs and answer tracking.
- **FR-03**: System MUST deliver realtime invitations and answer synchronization via Socket.io events (`game_invite`, `game_accept`, `game_answer`, `game_finish`).
- **FR-04**: System MUST calculate summary statistics and compatibility percentages.
- **FR-05**: System MUST provide API endpoints `POST /api/games/create`, `GET /api/games/:sessionId`, `POST /api/games/:sessionId/answer`, `GET /api/games/:sessionId/result`.
