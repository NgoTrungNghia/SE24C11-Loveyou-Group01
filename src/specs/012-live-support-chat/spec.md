# Feature Specification: Live Admin Support Chat

**Feature Branch**: `012-live-support-chat`  
**Created**: 2026-08-18  
**Status**: Approved / Implemented  

---

## 1. Overview & Context

To provide timely customer service, resolve billing issues, and guide users, LoveYou includes a dedicated **Live Admin Support Chat** system.
- Users can open the **SupportChatModal** from the sidebar or settings to send messages and report issues directly to the admin team.
- Administrators access a dedicated **Support Chat Panel** inside the Admin Dashboard to manage active support conversations, view user details, and respond in real-time.
- Messages are persisted in PostgreSQL and delivered instantly via Socket.io.

---

## 2. Actors & Permissions

- **User**: Can open their personal support conversation, send text messages, and receive real-time answers from Admin.
- **Admin**: Can view all incoming support conversations from users, select a user thread, and reply via WebSocket.

---

## 3. User Stories & Acceptance Criteria

### User Story 1 — User Initiating Support Chat (Priority: P1)
As a user, I want to open a support chat window to ask questions or report problems to customer support.

**Acceptance Criteria**:
1. Clicking the "Hỗ trợ" icon in the navigation bar opens `SupportChatModal`.
2. The modal fetches existing message history via `GET /api/support/messages`.
3. Typing a message and clicking "Gửi" sends `POST /api/support/messages` and emits `support_message` via Socket.io.
4. Messages appear immediately with timestamp and status indicators.

### User Story 2 — Admin Answering Support Requests (Priority: P1)
As an administrator, I want to manage a list of user support inquiries and respond to them in real-time.

**Acceptance Criteria**:
1. In the Admin Dashboard -> Tab "Hỗ trợ trực tuyến", Admin views all users who requested support.
2. Selecting a user conversation loads message history and marks messages as read.
3. Admin sends a reply via `POST /api/admin/support/messages` or Socket event `admin_support_reply`.
4. The user receives the reply in real-time with an incoming message notification.

---

## 4. Functional Requirements

- **FR-012-1**: System MUST create a one-to-one `SupportConversation` between each requesting user and the admin pool.
- **FR-012-2**: All messages MUST be stored in `support_messages` table with `senderId`, `isFromAdmin`, `content`, `createdAt`.
- **FR-012-3**: WebSocket events `support_message` and `admin_support_reply` MUST deliver messages instantly without page refresh.
