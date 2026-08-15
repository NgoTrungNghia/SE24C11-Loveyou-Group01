const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const config = require('./src/config');
const chatService = require('./src/services/chatService');
const supportService = require('./src/services/supportService');
const gameService = require('./src/services/gameService');
const geminiService = require('./src/services/geminiService');
const { verifyAccessToken } = require('./src/utils/token');
const { seedAdmin } = require('./src/services/adminService');
const { seedTestUsers } = require('./seedUsers');
const prisma = require('./src/utils/prismaClient');

seedAdmin();
seedTestUsers();

if (!config.EMAIL_USER || !config.EMAIL_APP_PASSWORD) {
  console.warn('Warning: EMAIL_USER or EMAIL_APP_PASSWORD is not set — OTP email will not work');
}

const port = config.PORT || 3000;
const httpServer = http.createServer(app);

// ── Socket.io Setup ──
const io = new Server(httpServer, {
  cors: {
    origin: true,
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

// Helper: emit đến tất cả sockets của một userId
function emitToUser(userId, event, data) {
  const sockets = onlineUsers.get(Number(userId));
  if (sockets) sockets.forEach(sId => io.to(sId).emit(event, data));
}

// Helper: emit đến cả 2 người trong session
function emitToBothPlayers(session, event, data) {
  emitToUser(session.initiatorId, event, data);
  emitToUser(session.partnerId, event, data);
}

io.on('connection', (socket) => {
  const uid = Number(socket.userId);
  console.log(`[Socket] User ${uid} connected (${socket.id})`);

  // Track online
  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  onlineUsers.get(uid).add(socket.id);
  chatService.updateLastActive(uid);

  // Send list of all currently online user IDs to the connecting user
  const currentOnlineUserIds = Array.from(onlineUsers.keys());
  socket.emit('initial_online_users', { userIds: currentOnlineUserIds });

  // Broadcast to all other users that this user came online
  io.emit('user_online', { userId: uid });

  socket.on('get_online_users', () => {
    socket.emit('initial_online_users', { userIds: Array.from(onlineUsers.keys()) });
  });

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

  // ── SUPPORT CHAT EVENTS ──
  socket.on('join_support_conversation', (conversationId) => {
    socket.join(`support_conv_${conversationId}`);
  });

  socket.on('leave_support_conversation', (conversationId) => {
    socket.leave(`support_conv_${conversationId}`);
  });

  socket.on('join_admin_support_channel', () => {
    if (socket.user?.role === 'ADMIN') {
      socket.join('admin_support_feed');
    }
  });

  socket.on('leave_admin_support_channel', () => {
    socket.leave('admin_support_feed');
  });

  socket.on('send_support_message', async ({ conversationId, content }) => {
    try {
      if (!content?.trim()) return;
      const isAdmin = socket.user?.role === 'ADMIN';

      if (isAdmin && conversationId) {
        const data = await supportService.sendAdminMessage(conversationId, uid, content.trim());
        io.to(`support_conv_${conversationId}`).emit('new_support_message', {
          message: data.message,
          conversationId,
        });
        io.to('admin_support_feed').emit('admin_support_updated', {
          conversation: data.conversation,
        });
        // Push direct notification to user
        emitToUser(data.targetUserId, 'support_notification', {
          message: data.message,
          conversation: data.conversation,
        });
      } else {
        const data = await supportService.sendUserMessage(uid, content.trim());
        io.to(`support_conv_${data.conversation.id}`).emit('new_support_message', {
          message: data.message,
          conversationId: data.conversation.id,
        });
        io.to('admin_support_feed').emit('admin_support_updated', {
          conversation: data.conversation,
        });
      }
    } catch (err) {
      socket.emit('support_error', { message: err.message });
    }
  });

  socket.on('mark_support_read', async ({ conversationId }) => {
    try {
      if (socket.user?.role === 'ADMIN' && conversationId) {
        await supportService.markAdminRead(conversationId);
        io.to('admin_support_feed').emit('admin_support_marked_read', { conversationId });
      }
    } catch { /* ignore */ }
  });

  // ── GAME EVENTS ──

  /**
   * A gửi lời mời chơi game đến B
   */
  socket.on('game_invite', async ({ partnerId, gameType, matchId }) => {
    const session = gameService.createGameSession(gameType, uid, partnerId, matchId);
    
    let inviterName = socket.user?.fullName || socket.user?.username || 'Đối phương';
    let inviterPhoto = socket.user?.photo || null;
    try {
      const inviterUser = await prisma.user.findUnique({ where: { userId: Number(uid) } });
      if (inviterUser) {
        inviterName = inviterUser.fullName || inviterUser.username || inviterName;
        inviterPhoto = (Array.isArray(inviterUser.photos) && inviterUser.photos[0]) || inviterUser.avatar || inviterPhoto;
      }
    } catch { /* ignore */ }

    // Thông báo cho B
    emitToUser(partnerId, 'game_invite_received', {
      session,
      inviterName,
      inviterPhoto,
    });
    socket.emit('game_invite_sent', { session });
  });

  /**
   * B chấp nhận lời mời → sinh câu hỏi bằng AI → gửi cho cả 2
   */
  socket.on('game_accept', async ({ sessionId }) => {
    const session = gameService.acceptGameSession(sessionId);
    if (!session) return socket.emit('error', { message: 'Session not found' });

    // Thông báo game bắt đầu (cả 2 bên thấy loading AI)
    emitToBothPlayers(session, 'game_started', { session });

    // Sinh câu hỏi bắt buộc bằng Gemini AI
    try {
      const aiQuestions = await geminiService.generateGameQuestions(session.gameType);

      if (aiQuestions && aiQuestions.length > 0) {
        gameService.setGameQuestions(sessionId, aiQuestions);
        const updatedSession = gameService.getGameSession(sessionId);
        emitToBothPlayers(session, 'game_questions_ready', { session: updatedSession });
      } else {
        throw new Error('Gemini API không trả về bộ câu hỏi hợp lệ');
      }
    } catch (err) {
      console.error('[Game] Sinh câu hỏi Gemini AI thất bại:', err.message);
      gameService.pauseGameSession(sessionId);
      emitToBothPlayers(session, 'game_paused', {
        sessionId,
        reason: 'Không thể sinh câu hỏi bằng Gemini AI. Vui lòng kiểm tra lại cấu hình Gemini API Key của Admin.',
      });
    }
  });

  /**
   * Một trong 2 gửi câu trả lời
   */
  socket.on('game_answer', ({ sessionId, questionIndex, answer }) => {
    const session = gameService.submitAnswer(sessionId, uid, questionIndex, answer);
    if (!session) return socket.emit('error', { message: 'Session not found' });

    // Thông báo cho cả 2 rằng user X đã trả lời câu Y
    emitToBothPlayers(session, 'game_answer_received', { sessionId, userId: uid, questionIndex });

    // Kiểm tra hoàn thành câu này
    const answers = session.gameData.answers[questionIndex] || {};
    let roundFinished = false;
    if (session.gameType === 'WOULD_YOU_RATHER') {
      roundFinished = answers[session.initiatorId] !== undefined && answers[session.partnerId] !== undefined;
    } else if (session.gameType === 'SPIN_THE_BOTTLE') {
      roundFinished = Object.keys(answers).length >= 1;
    }

    if (roundFinished) {
      emitToBothPlayers(session, 'game_both_answered', { sessionId, questionIndex, answers });
    }
  });

  /**
   * Kết thúc game → AI đánh giá kết quả → gửi cho cả 2
   */
  socket.on('game_finish', async ({ sessionId }) => {
    const session = gameService.getGameSession(sessionId);
    if (!session) return socket.emit('error', { message: 'Session not found' });

    const basicResult = gameService.computeGameResult(sessionId);

    try {
      const p1 = await prisma.user.findUnique({ where: { userId: Number(session.initiatorId) } });
      const p2 = await prisma.user.findUnique({ where: { userId: Number(session.partnerId) } });

      const p1Name = p1?.fullName || p1?.username || 'Người chơi 1';
      const p2Name = p2?.fullName || p2?.username || 'Người chơi 2';

      const aiEvaluation = await geminiService.evaluateGameResult(
        session.gameType,
        session.gameData.questions || [],
        session.gameData.answers || {},
        { id: session.initiatorId, name: p1Name },
        { id: session.partnerId, name: p2Name }
      );

      if (!aiEvaluation) {
        throw new Error('Gemini API không thể đánh giá kết quả');
      }

      const finalResult = { ...basicResult, ...aiEvaluation, aiPowered: true };
      emitToBothPlayers(session, 'game_result', { result: finalResult });
    } catch (err) {
      console.error('[Game] AI evaluation failed:', err.message);
      gameService.pauseGameSession(sessionId);
      emitToBothPlayers(session, 'game_paused', {
        sessionId,
        reason: 'Không thể đánh giá kết quả bằng Gemini AI. Vui lòng kiểm tra lại cấu hình Gemini API Key.',
      });
    }
  });

  /**
   * Người chơi chủ động thoát/đóng game
   */
  socket.on('game_leave', ({ sessionId }) => {
    if (!sessionId) return;
    const session = gameService.getGameSession(sessionId);
    if (!session) return;

    gameService.pauseGameSession(sessionId);
    const partnerId = session.initiatorId === uid ? session.partnerId : session.initiatorId;
    emitToUser(partnerId, 'game_paused', {
      sessionId: session.sessionId,
      reason: 'Đối phương đã đóng trò chơi',
    });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const userSockets = onlineUsers.get(uid);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(uid);
        io.emit('user_offline', { userId: uid });

        // Nếu user đang chơi game → thông báo cho đối phương
        const activeSessions = gameService.getActiveSessionsForUser(uid);
        activeSessions.forEach(session => {
          const partnerId = session.initiatorId === uid ? session.partnerId : session.initiatorId;
          emitToUser(partnerId, 'game_paused', {
            sessionId: session.sessionId,
            reason: 'Đối phương đã ngắt kết nối',
          });
          // Đánh dấu session là PAUSED
          gameService.pauseGameSession(session.sessionId);
        });
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
