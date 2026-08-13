const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const config = require('./src/config');
const chatService = require('./src/services/chatService');
const gameService = require('./src/services/gameService');
const { verifyAccessToken } = require('./src/utils/token');
const { seedAdmin } = require('./src/services/adminService');

seedAdmin();

if (!config.EMAIL_USER || !config.EMAIL_APP_PASSWORD) {
  console.warn('Warning: EMAIL_USER or EMAIL_APP_PASSWORD is not set — OTP email will not work');
}

const port = config.PORT || 3000;
const httpServer = http.createServer(app);

// ── Socket.io Setup ──
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

// JWT Auth middleware for Socket.io
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication error'));
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.userId;
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const uid = socket.userId;
  console.log(`[Socket] User ${uid} connected (${socket.id})`);

  // Track online
  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  onlineUsers.get(uid).add(socket.id);
  chatService.updateLastActive(uid);

  // Broadcast online status to all
  io.emit('user_online', { userId: uid });

  // ── JOIN CONVERSATION ROOM ──
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv_${conversationId}`);
  });

  // ── SEND MESSAGE (Realtime) ──
  socket.on('send_message', async ({ conversationId, content, type = 'TEXT' }) => {
    try {
      if (!content?.trim()) return;
      const message = await chatService.saveMessage(conversationId, uid, content.trim(), type);
      io.to(`conv_${conversationId}`).emit('new_message', { message, conversationId });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // ── TYPING INDICATOR ──
  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(`conv_${conversationId}`).emit('partner_typing', { userId: uid, isTyping });
  });

  // ── READ MESSAGES ──
  socket.on('mark_read', async ({ conversationId }) => {
    try {
      await chatService.markMessagesRead(conversationId, uid);
      socket.to(`conv_${conversationId}`).emit('messages_read', { conversationId, readBy: uid });
    } catch { /* ignore */ }
  });

  // ── GAME EVENTS ──
  socket.on('game_invite', ({ partnerId, gameType, matchId }) => {
    const session = gameService.createGameSession(gameType, uid, partnerId, matchId);
    // Notify partner
    const partnerSockets = onlineUsers.get(Number(partnerId));
    if (partnerSockets) {
      partnerSockets.forEach(sId => {
        io.to(sId).emit('game_invite_received', {
          session,
          inviterName: socket.user.username,
        });
      });
    }
    socket.emit('game_invite_sent', { session });
  });

  socket.on('game_accept', ({ sessionId }) => {
    const session = gameService.acceptGameSession(sessionId);
    if (!session) return socket.emit('error', { message: 'Session not found' });
    // Notify both players
    [session.initiatorId, session.partnerId].forEach(playerId => {
      const sockets = onlineUsers.get(playerId);
      if (sockets) sockets.forEach(sId => io.to(sId).emit('game_started', { session }));
    });
  });

  socket.on('game_answer', ({ sessionId, questionIndex, answer }) => {
    const session = gameService.submitAnswer(sessionId, uid, questionIndex, answer);
    if (!session) return socket.emit('error', { message: 'Session not found' });

    // Notify both players of answer submission
    [session.initiatorId, session.partnerId].forEach(playerId => {
      const sockets = onlineUsers.get(playerId);
      if (sockets) sockets.forEach(sId => io.to(sId).emit('game_answer_received', { sessionId, userId: uid, questionIndex }));
    });

    // Check if both answered current question
    const answers = session.gameData.answers[questionIndex] || {};
    const bothAnswered = answers[session.initiatorId] !== undefined && answers[session.partnerId] !== undefined;
    if (bothAnswered) {
      [session.initiatorId, session.partnerId].forEach(playerId => {
        const sockets = onlineUsers.get(playerId);
        if (sockets) sockets.forEach(sId => io.to(sId).emit('game_both_answered', { sessionId, questionIndex, answers: answers }));
      });
    }
  });

  socket.on('game_finish', ({ sessionId }) => {
    const result = gameService.computeGameResult(sessionId);
    if (!result) return socket.emit('error', { message: 'Cannot compute result' });
    const session = gameService.getGameSession(sessionId);
    if (session) {
      [session.initiatorId, session.partnerId].forEach(playerId => {
        const sockets = onlineUsers.get(playerId);
        if (sockets) sockets.forEach(sId => io.to(sId).emit('game_result', { result }));
      });
    }
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const userSockets = onlineUsers.get(uid);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(uid);
        io.emit('user_offline', { userId: uid });
      }
    }
    chatService.updateLastActive(uid);
    console.log(`[Socket] User ${uid} disconnected`);
  });
});

// Export io for use in controllers if needed
app.set('io', io);
app.set('onlineUsers', onlineUsers);

httpServer.listen(port, () => {
  console.log(`🚀 Server + Socket.io running on http://localhost:${port}`);
});
