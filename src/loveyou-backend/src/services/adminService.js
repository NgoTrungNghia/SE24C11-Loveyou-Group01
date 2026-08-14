const prisma = require('../utils/prismaClient');
const { hashPassword } = require('../utils/password');

async function seedAdmin() {
  try {
    const adminEmail = 'admin@loveyou.com';
    const passwordHash = await hashPassword('123456');

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { email: 'admin@love.you' },
          { username: 'admin' },
        ],
      },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: 'admin',
          email: adminEmail,
          passwordHash,
          fullName: 'System Administrator',
          role: 'ADMIN',
          status: 'ACTIVE',
          isProfileComplete: true,
          bio: 'Hệ thống Quản trị viên LoveYou',
        },
      });
    } else {
      await prisma.user.update({
        where: { userId: existingAdmin.userId },
        data: {
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }
  } catch (_err) {
    /* ignore seed conflict */
  }
}

async function getStats() {
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
  const bannedUsers = await prisma.user.count({ where: { status: 'BANNED' } });
  const totalMatches = await prisma.match.count();
  const totalSwipes = await prisma.swipe.count();

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const onlineCount = await prisma.user.count({
    where: {
      lastActiveAt: {
        gte: fiveMinutesAgo,
      },
    },
  });

  return {
    totalUsers,
    activeUsers,
    bannedUsers,
    totalMatches,
    totalSwipes,
    onlineUsers: onlineCount,
  };
}

async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      userId: true,
      username: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isVip: true,
      vipUntil: true,
      status: true,
      isProfileComplete: true,
      profilePicture: true,
      gender: true,
      dateOfBirth: true,
      height: true,
      location: true,
      bio: true,
      interests: true,
      photos: true,
      createdAt: true,
      lastActiveAt: true,
    },
  });
}

async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { userId: Number(userId) },
    select: {
      userId: true,
      username: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isVip: true,
      vipUntil: true,
      status: true,
      isProfileComplete: true,
      profilePicture: true,
      gender: true,
      dateOfBirth: true,
      height: true,
      location: true,
      bio: true,
      interests: true,
      photos: true,
      createdAt: true,
      lastActiveAt: true,
    },
  });
}

async function toggleBanStatus(adminUserId, targetUserId) {
  const targetId = Number(targetUserId);
  if (targetId === Number(adminUserId)) {
    const err = new Error('Admin cannot ban themselves');
    err.status = 400;
    err.code = 'CANNOT_BAN_SELF';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { userId: targetId } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';

  const updatedUser = await prisma.user.update({
    where: { userId: targetId },
    data: { status: newStatus },
    select: {
      userId: true,
      username: true,
      email: true,
      status: true,
      role: true,
    },
  });

  return updatedUser;
}

async function getReports() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: {
        select: {
          userId: true,
          username: true,
          email: true,
          fullName: true,
          profilePicture: true,
          status: true,
        },
      },
      reported: {
        select: {
          userId: true,
          username: true,
          email: true,
          fullName: true,
          profilePicture: true,
          status: true,
        },
      },
    },
  });
  return reports;
}

async function updateReportStatus(reportId, status) {
  const updatedReport = await prisma.report.update({
    where: { id: Number(reportId) },
    data: { status },
    include: {
      reporter: {
        select: {
          userId: true,
          username: true,
          email: true,
          fullName: true,
        },
      },
      reported: {
        select: {
          userId: true,
          username: true,
          email: true,
          fullName: true,
          status: true,
        },
      },
    },
  });
  return updatedReport;
}

// ── Gemini API Key Management ──
const geminiService = require('./geminiService');

async function getGeminiApiKeyForAdmin() {
  const masked = await geminiService.getMaskedApiKey();
  const hasKey = !!(await geminiService.getGeminiApiKey());
  return { masked, hasKey };
}

async function setGeminiApiKeyAdmin(key) {
  if (!key || typeof key !== 'string' || key.trim().length < 5) {
    throw new Error('API key không hợp lệ (quá ngắn hoặc rỗng)');
  }
  await geminiService.setGeminiApiKey(key.trim());
  return { success: true };
}

module.exports = {
  seedAdmin,
  getStats,
  getAllUsers,
  getUserById,
  toggleBanStatus,
  getReports,
  updateReportStatus,
  getGeminiApiKeyForAdmin,
  setGeminiApiKeyAdmin,
};
