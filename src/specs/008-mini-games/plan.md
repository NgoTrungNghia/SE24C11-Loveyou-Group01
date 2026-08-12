# Implementation Plan: 008 Mini-Games

## Architecture
- **Service Layer**: `gameService.js` managing question sets (12 Would You Rather options, 15 Spin the Bottle questions), session lifecycle (PENDING -> ACTIVE -> COMPLETED), answer recording, and compatibility result computation.
- **Backend Controller & Routes**: `gameController.js` and `gameRoutes.js` under `/api/games`.
- **Realtime Integration**: Socket.io handlers in `index.js` targeting individual player socket connections for instant invitation popups and synchronous answer reveals.
- **Frontend Layer**: `GameModal.jsx` component with multi-stage flow (SELECT -> WAITING -> PLAYING -> REVEAL -> RESULT), game invitation button in `ChatPanel.jsx`, and notification toast on `Dashboard.jsx`.
