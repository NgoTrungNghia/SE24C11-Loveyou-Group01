# Implementation Plan: 005 Realtime Chat

## Architecture
- **Database Layer**: `Conversation` and `Message` Prisma models with relations to `User` and `Match`.
- **Backend Service Layer**: `chatService.js` handling conversation initialization, message persistence, read status updating, and user last active updates.
- **Backend Controller & Routes**: `chatController.js` and `chatRoutes.js` under `/api/chat` (`GET /conversations`, `GET /conversations/:matchId/init`, `GET /:conversationId/messages`, `POST /:conversationId/messages`, `PUT /:conversationId/read`).
- **Realtime Layer**: `Socket.io` server integrated into `index.js` with JWT authentication middleware, room-based message broadcasting (`conv_{conversationId}`), and online user map tracking.
- **Frontend Layer**: `socket.js` client singleton, `chatApi` in `api.js`, and `ChatPanel.jsx` component with realtime message handling, typing indicators, read receipts, and date grouping.
