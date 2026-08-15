const prisma = require('../utils/prismaClient');
const { hashPassword } = require('../utils/password');

async function seedAdmin() {
  try {
    const passwordHash = await hashPassword('123456');
    const admins = [
      { username: 'admin1', email: 'admin1@gmail.com', fullName: 'Quản Trị Viên 1 (Admin 1)', bio: 'Ban Quản Trị Hệ Thống LoveYou (Admin 1) 👑' },
      { username: 'admin2', email: 'admin2@gmail.com', fullName: 'Quản Trị Viên 2 (Admin 2)', bio: 'Ban Quản Trị Hệ Thống LoveYou (Admin 2) 👑' },
    ];

    for (const adm of admins) {
      await prisma.user.upsert({
        where: { email: adm.email },
        update: {
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        create: {
          username: adm.username,
          email: adm.email,
          passwordHash,
          fullName: adm.fullName,
          role: 'ADMIN',
          status: 'ACTIVE',
          isProfileComplete: true,
          isEmailVerified: true,
          isCitizenVerified: true,
          bio: adm.bio,
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
      isEmailVerified: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      citizenFrontPhoto: true,
      citizenBackPhoto: true,
      citizenIdNumber: true,
      citizenName: true,
      citizenDob: true,
      citizenGender: true,
      citizenAddress: true,
      citizenIssueDate: true,
      citizenVerifiedAt: true,
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
      isEmailVerified: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      citizenFrontPhoto: true,
      citizenBackPhoto: true,
      citizenIdNumber: true,
      citizenName: true,
      citizenDob: true,
      citizenGender: true,
      citizenAddress: true,
      citizenIssueDate: true,
      citizenVerifiedAt: true,
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

async function updateReportStatus(reportId, status, resolution = null) {
  const data = { status };
  if (resolution !== undefined) {
    data.resolution = resolution;
  }
  const updatedReport = await prisma.report.update({
    where: { id: Number(reportId) },
    data,
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
  return updatedReport;
}

// ── Citizen Identity (CCCD) Verification Management ──
async function getCitizenVerifications() {
  return prisma.user.findMany({
    where: {
      OR: [
        { citizenFrontPhoto: { not: null } },
        { citizenVerificationStatus: { in: ['PENDING', 'APPROVED', 'REJECTED'] } },
        { isCitizenVerified: true },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      userId: true,
      username: true,
      email: true,
      fullName: true,
      profilePicture: true,
      gender: true,
      dateOfBirth: true,
      isEmailVerified: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      citizenFrontPhoto: true,
      citizenBackPhoto: true,
      citizenVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function approveCitizenVerification(targetUserId) {
  const user = await prisma.user.update({
    where: { userId: Number(targetUserId) },
    data: {
      isCitizenVerified: true,
      citizenVerificationStatus: 'APPROVED',
      citizenRejectReason: null,
      citizenVerifiedAt: new Date(),
    },
    select: {
      userId: true,
      username: true,
      email: true,
      fullName: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      citizenVerifiedAt: true,
    },
  });
  return user;
}

async function rejectCitizenVerification(targetUserId, reason = 'Ảnh chụp CCCD không rõ ràng hoặc không hợp lệ') {
  const user = await prisma.user.update({
    where: { userId: Number(targetUserId) },
    data: {
      isCitizenVerified: false,
      citizenVerificationStatus: 'REJECTED',
      citizenRejectReason: reason,
    },
    select: {
      userId: true,
      username: true,
      email: true,
      fullName: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      citizenVerifiedAt: true,
    },
  });
  return user;
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
  getCitizenVerifications,
  approveCitizenVerification,
  rejectCitizenVerification,
  getGeminiApiKeyForAdmin,
  setGeminiApiKeyAdmin,
};
