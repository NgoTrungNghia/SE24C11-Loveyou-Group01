const prisma = require('../utils/prismaClient');

/**
 * Lấy hoặc tạo Conversation từ matchId
 */
async function getOrCreateConversation(matchId) {
  const mId = Number(matchId);
  if (isNaN(mId)) throw new Error('Invalid matchId');

  let conversation = await prisma.conversation.findUnique({
    where: { matchId: mId },
  });
  if (!conversation) {
    const matchObj = await prisma.match.findUnique({ where: { matchId: mId } });
    if (!matchObj) throw new Error('Match record not found');

    conversation = await prisma.conversation.create({
      data: { matchId: mId },
    });
  }
  return conversation;
}

/**
 * Xóa trò chuyện phía người dùng hiện tại (Soft clear for me)
 */
async function clearConversationForUser(conversationId, userId) {
  const convId = Number(conversationId);
  const uid = Number(userId);

  if (isNaN(convId) || isNaN(uid)) throw new Error('Invalid input');

  await prisma.userConversationClear.upsert({
    where: {
      userId_conversationId: {
        userId: uid,
        conversationId: convId,
      },
    },
    update: {
      clearedAt: new Date(),
    },
    create: {
      userId: uid,
      conversationId: convId,
      clearedAt: new Date(),
    },
  });

  return { success: true, message: 'Đã xóa trò chuyện phía bạn' };
}

/**
 * Lấy tất cả conversations của user (qua Match)
 */
async function getUserConversations(userId) {
  const uid = Number(userId);

  const blocksGiven = await prisma.userBlock.findMany({
    where: { blockerId: uid },
    select: { blockedId: true },
  });
  const blocksReceived = await prisma.userBlock.findMany({
    where: { blockedId: uid },
    select: { blockerId: true },
  });
  const givenSet = new Set(blocksGiven.map(b => b.blockedId));
  const receivedSet = new Set(blocksReceived.map(b => b.blockerId));

  const userClears = await prisma.userConversationClear.findMany({
    where: { userId: uid },
  });
  const clearMap = new Map(userClears.map(c => [c.conversationId, c.clearedAt]));

  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: uid }, { user2Id: uid }] },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
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
    const convId = m.conversation?.id || null;
    const clearedAt = convId ? clearMap.get(convId) : null;

    let validMessages = m.conversation?.messages || [];
    if (clearedAt) {
      validMessages = validMessages.filter(msg => new Date(msg.createdAt) > new Date(clearedAt));
    }
    const lastMsg = validMessages[0] || null;

    const photosList = parsePhotos(partner.photos);
    const isBlockedByMe = givenSet.has(partner.userId);
    const isBlockedByPartner = receivedSet.has(partner.userId);
    const isBlocked = isBlockedByMe || isBlockedByPartner;

    return {
      matchId: m.matchId,
      conversationId: convId,
      partner: {
        id: partner.userId,
        name: partner.fullName || partner.username,
        photo: photosList[0] || partner.profilePicture || null,
        lastActiveAt: partner.lastActiveAt,
        isBlocked,
        isBlockedByMe,
        isBlockedByPartner,
      },
      lastMessage: lastMsg
        ? { content: lastMsg.content, type: lastMsg.type, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
        : null,
      matchedAt: m.createdAt,
      isBlocked,
      isBlockedByMe,
      isBlockedByPartner,
    };
  });
}

/**
 * Lấy lịch sử tin nhắn của một conversation (paginated & filtered by user clear timestamp)
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

  // Check if user cleared this conversation previously
  const userClear = await prisma.userConversationClear.findUnique({
    where: {
      userId_conversationId: {
        userId: uid,
        conversationId: convId,
      },
    },
  });

  const whereClause = { conversationId: convId };
  if (userClear && userClear.clearedAt) {
    whereClause.createdAt = { gt: userClear.clearedAt };
  }

  const skip = (page - 1) * limit;
  const messages = await prisma.message.findMany({
    where: whereClause,
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
 * Lưu tin nhắn mới (Kiểm tra chặn)
 */
async function saveMessage(conversationId, senderId, content, type = 'TEXT') {
  const convId = Number(conversationId);
  const sid = Number(senderId);

  // 1. Xác định partnerId trong conversation
  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { match: { select: { user1Id: true, user2Id: true } } },
  });
  if (!conv) throw new Error('Cuộc trò chuyện không tồn tại');

  const partnerId = conv.match.user1Id === sid ? conv.match.user2Id : conv.match.user1Id;

  // 2. Kiểm tra nếu có bất kỳ lệnh chặn nào giữa 2 người
  const blockRecord = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: sid, blockedId: partnerId },
        { blockerId: partnerId, blockedId: sid },
      ],
    },
  });

  if (blockRecord) {
    throw new Error('Tài khoản này đã bị chặn. Không thể gửi tin nhắn mới.');
  }

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
  clearConversationForUser,
  getUserConversations,
  getMessages,
  saveMessage,
  markMessagesRead,
  updateLastActive,
};
