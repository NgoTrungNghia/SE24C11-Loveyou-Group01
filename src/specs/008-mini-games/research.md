# Research & Decisions: 008 Mini-Games

## In-Memory Session Map vs DB Persistence
- **Decision**: In-memory `Map` (`gameSessions`) for active game states.
- **Rationale**: Game sessions are short-lived interactive events (2-3 minutes). Storing state in memory enables ultra-fast answer synchronization without database lock contention.

## Realtime Synchronization Pattern
- **Decision**: Socket.io push notifications (`game_both_answered`, `game_result`).
- **Rationale**: When both users answer a question, the server detects completion and pushes a single synchronized reveal event to both player sockets, ensuring a seamless simultaneous reveal animation.
