const chatService = require('../services/chatService');
const { success } = require('./baseController');

async function getConversations(req, res, next) {
  try {
    const conversations = await chatService.getUserConversations(req.user.userId);
    return success(res, { conversations });
  } catch (err) { return next(err); }
}

async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const messages = await chatService.getMessages(conversationId, req.user.userId, page);
    return success(res, { messages, page });
  } catch (err) { return next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { content, type = 'TEXT' } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Content is required' } });
    }
    const message = await chatService.saveMessage(conversationId, req.user.userId, content.trim(), type);
    return success(res, { message });
  } catch (err) { return next(err); }
}

async function markRead(req, res, next) {
  try {
    const { conversationId } = req.params;
    await chatService.markMessagesRead(conversationId, req.user.userId);
    return success(res, { ok: true });
  } catch (err) { return next(err); }
}

async function getOrCreateConversation(req, res, next) {
  try {
    const { matchId } = req.params;
    const conv = await chatService.getOrCreateConversation(matchId);
    return success(res, { conversation: conv });
  } catch (err) { return next(err); }
}

async function clearConversation(req, res, next) {
  try {
    const { conversationId } = req.params;
    const result = await chatService.clearConversationForUser(conversationId, req.user.userId);
    return success(res, result);
  } catch (err) { return next(err); }
}

async function detectRedFlags(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const prisma = require('../utils/prismaClient');
    const geminiService = require('../services/geminiService');

    const conv = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
      include: {
        match: {
          include: {
            user1: { select: { userId: true, fullName: true, username: true } },
            user2: { select: { userId: true, fullName: true, username: true } },
          },
        },
      },
    });

    if (!conv) {
      return res.status(404).json({ success: false, error: { message: 'Không tìm thấy cuộc trò chuyện' } });
    }

    const { user1, user2 } = conv.match;
    if (userId !== user1.userId && userId !== user2.userId) {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const currentUser = userId === user1.userId ? user1 : user2;
    const partnerUser = userId === user1.userId ? user2 : user1;
    const currentUserName = currentUser.fullName || currentUser.username || 'Bạn';
    const partnerName = partnerUser.fullName || partnerUser.username || 'Đối phương';

    const messages = await prisma.message.findMany({
      where: { conversationId: Number(conversationId) },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: { select: { userId: true, fullName: true, username: true } },
      },
    });

    const formattedMessages = messages.reverse().map(m => ({
      senderName: m.senderId === userId ? currentUserName : partnerName,
      content: m.content,
      createdAt: m.createdAt,
    }));

    const analysis = await geminiService.detectRedFlags(formattedMessages, currentUserName, partnerName);
    return success(res, { analysis });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getConversations, getMessages, sendMessage, markRead, getOrCreateConversation, clearConversation, detectRedFlags };
