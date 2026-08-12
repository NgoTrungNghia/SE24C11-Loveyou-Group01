const prisma = require('../utils/prismaClient');

/**
 * Lấy hoặc tạo Conversation từ matchId
 */
async function getOrCreateConversation(matchId) {
  let conversation = await prisma.conversation.findUnique({
    where: { matchId: Number(matchId) },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { matchId: Number(matchId) },
    });
  }
  return conversation;
}

/**
 * Lấy tất cả conversations của user (qua Match)
 */
async function getUserConversations(userId) {
  const uid = Number(userId);
  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: uid }, { user2Id: uid }] },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      user1: {
        select: {
          userId: true, username: true, fullName: true,
          profilePicture: true, photos: true, lastActiveAt: true,
        },
      },
      user2: {
        select: {
          userId: true, username: true, fullName: true,
          profilePicture: true, photos: true, lastActiveAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return matches.map(m => {
    const partner = m.user1Id === uid ? m.user2 : m.user1;
    const lastMsg = m.conversation?.messages?.[0] || null;
    const photosList = parsePhotos(partner.photos);
    return {
      matchId: m.matchId,
      conversationId: m.conversation?.id || null,
      partner: {
        id: partner.userId,
        name: partner.fullName || partner.username,
        photo: photosList[0] || partner.profilePicture || null,
        lastActiveAt: partner.lastActiveAt,
      },
      lastMessage: lastMsg
        ? { content: lastMsg.content, type: lastMsg.type, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
        : null,
      matchedAt: m.createdAt,
    };
  });
}

/**
 * Lấy lịch sử tin nhắn của một conversation (paginated)
 */
async function getMessages(conversationId, userId, page = 1, limit = 30) {
  const convId = Number(conversationId);
  const uid = Number(userId);

  // Xác minh user thuộc conversation
  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: {
      match: { select: { user1Id: true, user2Id: true } },
    },
  });
  if (!conv) throw new Error('Conversation not found');
  const { user1Id, user2Id } = conv.match;
  if (uid !== user1Id && uid !== user2Id) throw new Error('Unauthorized');

  const skip = (page - 1) * limit;
  const messages = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      sender: { select: { userId: true, username: true, fullName: true, profilePicture: true } },
    },
  });

  return messages.reverse();
}

/**
 * Lưu tin nhắn mới
 */
async function saveMessage(conversationId, senderId, content, type = 'TEXT') {
  const convId = Number(conversationId);
  const sid = Number(senderId);

  const message = await prisma.message.create({
    data: { conversationId: convId, senderId: sid, content, type },
    include: {
      sender: { select: { userId: true, username: true, fullName: true, profilePicture: true } },
    },
  });

  // Update conversation updatedAt
  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  });

  return message;
}

/**
 * Đánh dấu tất cả tin nhắn chưa đọc trong conversation là đã đọc
 */
async function markMessagesRead(conversationId, userId) {
  await prisma.message.updateMany({
    where: {
      conversationId: Number(conversationId),
      readAt: null,
      senderId: { not: Number(userId) },
    },
    data: { readAt: new Date() },
  });
}

/**
 * Cập nhật lastActiveAt của user
 */
async function updateLastActive(userId) {
  try {
    await prisma.user.update({
      where: { userId: Number(userId) },
      data: { lastActiveAt: new Date() },
    });
  } catch { /* ignore */ }
}

function parsePhotos(val) {
  if (!val) return [];
  try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; }
}

module.exports = {
  getOrCreateConversation,
  getUserConversations,
  getMessages,
  saveMessage,
  markMessagesRead,
  updateLastActive,
};
