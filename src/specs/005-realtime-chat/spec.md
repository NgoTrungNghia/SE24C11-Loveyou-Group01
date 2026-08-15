# Feature Specification: Realtime Chat & Messaging (005)

**Feature Branch**: `005-realtime-chat`

**Created**: 2026-08-12

**Status**: Completed

**Input**: User description: "Implement 1-on-1 realtime chat messaging system between matched users using Socket.io and REST APIs. Includes conversation creation, message history, typing indicators, read receipts, and online status tracking."

## User Scenarios & Acceptance Criteria

### User Story 1 - Realtime Chat Messaging (Priority: P1)
Matched users can open a chat panel with their partner and send/receive messages instantly without refreshing the page using Socket.io WebSockets.

### User Story 2 - Conversation & Message History (Priority: P1)
Users can view a list of active conversations in the sidebar with last message preview and unread status. Opening a conversation loads full message history with date grouping.

### User Story 3 - Typing Indicator & Read Receipts (Priority: P2)
Users see a live "Đang gõ..." typing animation when their partner is typing, and message status updates to double checkmarks (✓✓) when read.

### User Story 4 - Online Status Tracking (Priority: P2)
Users see a green online indicator dot (🟢) next to matched partners who are currently online.

## Requirements

- **FR-01**: System MUST create or fetch a `Conversation` record when two matched users initiate chat.
- **FR-02**: System MUST store all messages in the `Message` database table with sender ID, conversation ID, content, and read status timestamp.
- **FR-03**: System MUST support realtime message delivery via Socket.io (`send_message`, `new_message` events).
- **FR-04**: System MUST support typing status indicators via Socket.io (`typing`, `partner_typing`).
- **FR-05**: System MUST update read status (`mark_read`, `messages_read`) and broadcast read receipts.
- **FR-06**: System MUST track socket connection/disconnection to update user online status (`user_online`, `user_offline`).
