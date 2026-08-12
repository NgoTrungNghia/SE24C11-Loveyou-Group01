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

module.exports = { getConversations, getMessages, sendMessage, markRead, getOrCreateConversation };
