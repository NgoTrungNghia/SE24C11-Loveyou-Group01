# Quickstart: 005 Realtime Chat

## Starting the Chat Server

1. Ensure `.env` contains `JWT_SECRET` and `DATABASE_URL`.
2. Start backend server:
   ```bash
   cd src/loveyou-backend
   npm run dev
   ```
   Server will run at `http://localhost:3000` with WebSocket support enabled on the same port.

3. Start frontend app:
   ```bash
   cd src/loveyou-frontend
   npm run dev
   ```
   App will run at `http://localhost:5173`.

4. Log in with two different user accounts in separate browser sessions (or incognito window) to test realtime messaging.
