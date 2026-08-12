# Tasks: 005 Realtime Chat

- [x] Add `Conversation` and `Message` models & `MessageType` enum to `schema.prisma`
- [x] Run `npx prisma migrate dev` to generate database migration
- [x] Install `socket.io` (backend) and `socket.io-client` (frontend)
- [x] Create `chatService.js` (conversation init, message saving, read status update)
- [x] Create `chatController.js` and `chatRoutes.js` under `/api/chat`
- [x] Configure Socket.io server with JWT authentication in `index.js`
- [x] Implement realtime socket events (`send_message`, `typing`, `mark_read`, `join_conversation`)
- [x] Create frontend `socket.js` client utility
- [x] Export `chatApi` in `api.js`
- [x] Create `ChatPanel.jsx` component with realtime message flow, typing indicator, and date grouping
- [x] Integrate Chat tab and online status indicators into `Dashboard.jsx`
