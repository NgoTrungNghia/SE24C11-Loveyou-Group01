# Research & Decisions: 005 Realtime Chat

## Socket.io vs HTTP Polling
- **Decision**: Socket.io over WebSockets with HTTP polling fallback.
- **Rationale**: Realtime chat requires sub-second message latency, typing indicators, and immediate read receipt feedback. Socket.io provides automatic room management (`io.to('conv_X')`), transport fallback, and simple JWT handshake auth.

## In-Memory Online User Map vs Database Status
- **Decision**: Maintain `onlineUsers` Map (`userId` -> `Set<socketId>`) in server memory while persisting `lastActiveAt` timestamp in PostgreSQL.
- **Rationale**: Memory lookup allows instantaneous online status broadcasts (`user_online`, `user_offline`) without overloading DB write queries on connection events.
