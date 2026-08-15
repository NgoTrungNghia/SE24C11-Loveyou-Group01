const prisma = require('../utils/prismaClient');

/**
 * Lấy hoặc tạo phòng chat hỗ trợ duy nhất cho người dùng
 */
async function getOrCreateUserConversation(userId) {
  const uid = Number(userId);
  if (!uid || isNaN(uid)) throw new Error('Invalid userId');

  let conv = await prisma.supportConversation.findUnique({
    where: { userId: uid },
    include: {
      user: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          email: true,
          profilePicture: true,
          isVip: true,
          role: true,
        },
      },
    },
  });

  if (!conv) {
    conv = await prisma.supportConversation.create({
      data: {
        userId: uid,
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            fullName: true,
            email: true,
            profilePicture: true,
            isVip: true,
            role: true,
          },
        },
      },
    });
  }

  return conv;
}

/**
 * Lấy lịch sử tin nhắn hỗ trợ của người dùng
 */
async function getUserMessages(userId) {
  const conv = await getOrCreateUserConversation(userId);

  // Đánh dấu user đã đọc
  if (conv.userUnreadCount > 0) {
    await prisma.supportConversation.update({
      where: { id: conv.id },
      data: { userUnreadCount: 0 },
    });
  }

  const messages = await prisma.supportMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          profilePicture: true,
          role: true,
        },
      },
    },
  });

  return {
    conversation: { ...conv, userUnreadCount: 0 },
    messages,
  };
}

/**
 * Người dùng gửi tin nhắn hỗ trợ đến Admin
 */
async function sendUserMessage(userId, content) {
  const uid = Number(userId);
  if (!content || !content.trim()) throw new Error('Content is required');

  const conv = await getOrCreateUserConversation(uid);

  const message = await prisma.supportMessage.create({
    data: {
      conversationId: conv.id,
      senderId: uid,
      senderRole: 'USER',
      content: content.trim(),
    },
    include: {
      sender: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          profilePicture: true,
          role: true,
        },
      },
    },
  });

  // Cập nhật conversation & tăng adminUnreadCount
  const updatedConv = await prisma.supportConversation.update({
    where: { id: conv.id },
    data: {
      lastMessageText: content.trim(),
      lastMessageAt: new Date(),
      adminUnreadCount: { increment: 1 },
    },
    include: {
      user: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          email: true,
          profilePicture: true,
          isVip: true,
          role: true,
        },
      },
    },
  });

  return { message, conversation: updatedConv };
}

/**
 * Admin lấy danh sách toàn bộ hội thoại hỗ trợ (Sắp xếp: Chưa đọc đưa lên đầu)
 */
async function getAdminConversations(search = '') {
  const q = String(search || '').trim().toLowerCase();

  const convs = await prisma.supportConversation.findMany({
    orderBy: [
      { adminUnreadCount: 'desc' },
      { lastMessageAt: 'desc' },
    ],
    include: {
      user: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          email: true,
          profilePicture: true,
          isVip: true,
          status: true,
          isEmailVerified: true,
          isCitizenVerified: true,
          role: true,
        },
      },
    },
  });

  if (!q) return convs;

  return convs.filter(c => {
    const u = c.user || {};
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });
}

/**
 * Admin mở xem tin nhắn của một cuộc hội thoại (Reset adminUnreadCount)
 */
async function getAdminConversationMessages(conversationId) {
  const convId = Number(conversationId);
  if (!convId || isNaN(convId)) throw new Error('Invalid conversationId');

  const conv = await prisma.supportConversation.findUnique({
    where: { id: convId },
    include: {
      user: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          email: true,
          profilePicture: true,
          isVip: true,
          status: true,
          role: true,
        },
      },
    },
  });

  if (!conv) throw new Error('Cuộc trò chuyện hỗ trợ không tồn tại');

  // Đánh dấu admin đã đọc
  if (conv.adminUnreadCount > 0) {
    await prisma.supportConversation.update({
      where: { id: convId },
      data: { adminUnreadCount: 0 },
    });
  }

  const messages = await prisma.supportMessage.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          profilePicture: true,
          role: true,
        },
      },
    },
  });

  return {
    conversation: { ...conv, adminUnreadCount: 0 },
    messages,
  };
}

/**
 * Bất kỳ Admin nào gửi phản hồi cho người dùng
 */
async function sendAdminMessage(conversationId, adminUserId, content) {
  const convId = Number(conversationId);
  const aId = Number(adminUserId);
  if (!convId || isNaN(convId)) throw new Error('Invalid conversationId');
  if (!content || !content.trim()) throw new Error('Content is required');

  const conv = await prisma.supportConversation.findUnique({
    where: { id: convId },
    include: { user: true },
  });

  if (!conv) throw new Error('Cuộc trò chuyện hỗ trợ không tồn tại');

  const message = await prisma.supportMessage.create({
    data: {
      conversationId: convId,
      senderId: aId,
      senderRole: 'ADMIN',
      content: content.trim(),
    },
    include: {
      sender: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          profilePicture: true,
          role: true,
        },
      },
    },
  });

  // Cập nhật conversation & tăng userUnreadCount
  const updatedConv = await prisma.supportConversation.update({
    where: { id: convId },
    data: {
      lastMessageText: content.trim(),
      lastMessageAt: new Date(),
      userUnreadCount: { increment: 1 },
    },
    include: {
      user: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          email: true,
          profilePicture: true,
          isVip: true,
          role: true,
        },
      },
    },
  });

  return { message, conversation: updatedConv, targetUserId: conv.userId };
}

/**
 * Đánh dấu đã đọc hội thoại cho Admin
 */
async function markAdminRead(conversationId) {
  const convId = Number(conversationId);
  await prisma.supportConversation.update({
    where: { id: convId },
    data: { adminUnreadCount: 0 },
  });
  return { success: true };
}

/**
 * Admin lấy hoặc tạo cuộc hội thoại hỗ trợ với một userId cụ thể
 */
async function getOrCreateAdminConversationForUser(userId) {
  const conv = await getOrCreateUserConversation(userId);
  return getAdminConversationMessages(conv.id);
}

module.exports = {
  getOrCreateUserConversation,
  getUserMessages,
  sendUserMessage,
  getAdminConversations,
  getAdminConversationMessages,
  getOrCreateAdminConversationForUser,
  sendAdminMessage,
  markAdminRead,
};
