# Feature Specification: Realtime Chat & Messaging (005)

**Feature Branch**: `005-realtime-chat`  
**Created**: 2026-08-12 (Updated: 2026-08-18)  
**Status**: Completed / Enhanced  

---

## 1. Overview & Context
1-on-1 realtime chat messaging system between matched users using Socket.io and REST APIs. Includes conversation auto-initialization, message history, typing indicators, read receipts, online status tracking, user blocking/unblocking with real-time sync, AI red-flag detection, and message clearing.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 — Realtime Chat Messaging & Media (Priority: P1)
Matched users can open a chat panel with their partner and send/receive text and image messages instantly without refreshing the page using Socket.io WebSockets.

### User Story 2 — Conversation Auto-Init & History (Priority: P1)
Before opening chat, client calls `GET /api/chat/conversations/:matchId/init` to ensure the `Conversation` entity exists, preventing race conditions. Opening a conversation loads paginated history.

### User Story 3 — Real-time User Blocking & Safety (Priority: P1)
User can block an abusive partner (`POST /api/users/block`). The server dispatches `user_block_updated` via Socket.io. Both clients immediately disable the chat input and display block banners without needing page refresh.

### User Story 4 — AI Red-Flag Detection (Priority: P2)
User can click "Phát hiện Red Flag AI" (`POST /api/chat/:conversationId/detect-red-flags`). An AI rule analyzer scans recent messages for suspicious patterns (financial scams, aggressive language, unsolicited requests) and returns a safety advisory.

### User Story 5 — Clear Conversation History (Priority: P2)
User can clear chat history on their side (`POST /api/chat/:conversationId/clear`). The system records a `UserConversationClear` entry so older messages are hidden for the requesting user while preserved for partner and audit logs.

### User Story 6 — Online Status & Typing Indicators (Priority: P2)
Live green indicator dot (🟢) and real-time "Đang gõ..." typing animations.

---

## 3. Requirements

- **FR-005-1**: System MUST provide `GET /api/chat/conversations/:matchId/init` with `upsert` semantics to guarantee conversation existence.
- **FR-005-2**: System MUST store messages in `messages` table with types `TEXT`, `IMAGE`, `GAME_INVITE`, `GAME_RESULT`.
- **FR-005-3**: System MUST enforce unmatch & block restrictions before saving/sending new messages.
- **FR-005-4**: System MUST synchronize block/unblock state in real-time via Socket.io `user_block_updated`.
- **FR-005-5**: System MUST provide `POST /api/chat/:conversationId/detect-red-flags` for safety checks.
- **FR-005-6**: System MUST provide `POST /api/chat/:conversationId/clear` for single-sided history clearing.
