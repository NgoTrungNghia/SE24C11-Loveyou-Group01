const supportService = require('../services/supportService');
const { success } = require('./baseController');

// ── USER CONTROLLERS ──

async function getMyConversation(req, res, next) {
  try {
    const data = await supportService.getUserMessages(req.user.userId);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function sendUserMessage(req, res, next) {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Nội dung tin nhắn không được để trống' } });
    }
    const data = await supportService.sendUserMessage(req.user.userId, content);

    // Realtime broadcast to support room and admin feed
    const io = req.app.get('io');
    if (io) {
      io.to(`support_conv_${data.conversation.id}`).emit('new_support_message', {
        message: data.message,
        conversationId: data.conversation.id,
      });
      io.to('admin_support_feed').emit('admin_support_updated', {
        conversation: data.conversation,
      });
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

// ── ADMIN CONTROLLERS ──

async function getAdminConversations(req, res, next) {
  try {
    const { search } = req.query;
    const conversations = await supportService.getAdminConversations(search);
    return success(res, { conversations });
  } catch (err) {
    return next(err);
  }
}

async function getAdminConversationMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const data = await supportService.getAdminConversationMessages(conversationId);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function sendAdminMessage(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Nội dung tin nhắn không được để trống' } });
    }
    const data = await supportService.sendAdminMessage(conversationId, req.user.userId, content);

    // Realtime broadcast to support room, admin feed, and direct user
    const io = req.app.get('io');
    if (io) {
      io.to(`support_conv_${conversationId}`).emit('new_support_message', {
        message: data.message,
        conversationId: Number(conversationId),
      });
      io.to('admin_support_feed').emit('admin_support_updated', {
        conversation: data.conversation,
      });
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function markAdminRead(req, res, next) {
  try {
    const { conversationId } = req.params;
    const data = await supportService.markAdminRead(conversationId);

    const io = req.app.get('io');
    if (io) {
      io.to('admin_support_feed').emit('admin_support_marked_read', { conversationId: Number(conversationId) });
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function getAdminConversationByUserId(req, res, next) {
  try {
    const { userId } = req.params;
    const data = await supportService.getOrCreateAdminConversationForUser(userId);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyConversation,
  sendUserMessage,
  getAdminConversations,
  getAdminConversationMessages,
  getAdminConversationByUserId,
  sendAdminMessage,
  markAdminRead,
};
