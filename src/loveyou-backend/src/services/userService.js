const prisma = require('../utils/prismaClient');
const bcrypt = require('bcrypt');
const emailService = require('./emailService');

function parseJsonField(val) {
  if (!val) return [];
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return [];
  }
}

function stringifyJsonField(val) {
  if (!val) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { userId: Number(userId) },
    select: {
      userId: true,
      username: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      gender: true,
      dateOfBirth: true,
      profilePicture: true,
      bio: true,
      height: true,
      location: true,
      latitude: true,
      longitude: true,
      interests: true,
      photos: true,
      isProfileComplete: true,
      isVip: true,
      vipUntil: true,
      isEmailVerified: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      citizenIdNumber: true,
      citizenName: true,
      citizenDob: true,
      citizenGender: true,
      citizenAddress: true,
      citizenIssueDate: true,
      citizenFrontPhoto: true,
      citizenBackPhoto: true,
      citizenVerifiedAt: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user) {
    user.interests = parseJsonField(user.interests);
    user.photos = parseJsonField(user.photos);
  }
  return user;
}

async function updateUserProfile(userId, profileData) {
  const { fullName, phoneNumber, gender, dateOfBirth, profilePicture, bio, height, location, latitude, longitude, interests, photos, isProfileComplete } = profileData;
  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (gender !== undefined) updateData.gender = gender;
  if (dateOfBirth !== undefined) {
    if (!dateOfBirth) {
      updateData.dateOfBirth = null;
    } else {
      const d = new Date(dateOfBirth);
      updateData.dateOfBirth = isNaN(d.getTime()) ? null : d;
    }
  }
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
  if (bio !== undefined) updateData.bio = bio;
  if (height !== undefined) {
    if (height === null || height === undefined || height === '') {
      updateData.height = null;
    } else {
      const parsedHeight = parseInt(height, 10);
      updateData.height = isNaN(parsedHeight) ? null : parsedHeight;
    }
  }
  if (location !== undefined) updateData.location = location;
  if (latitude !== undefined) {
    updateData.latitude = (latitude === null || latitude === undefined || isNaN(Number(latitude))) ? null : parseFloat(latitude);
  }
  if (longitude !== undefined) {
    updateData.longitude = (longitude === null || longitude === undefined || isNaN(Number(longitude))) ? null : parseFloat(longitude);
  }
  if (interests !== undefined) updateData.interests = stringifyJsonField(interests);
  if (photos !== undefined) updateData.photos = stringifyJsonField(photos);
  if (isProfileComplete !== undefined) updateData.isProfileComplete = Boolean(isProfileComplete);

  const user = await prisma.user.update({
    where: { userId: Number(userId) },
    data: updateData,
    select: {
      userId: true,
      username: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      gender: true,
      dateOfBirth: true,
      profilePicture: true,
      bio: true,
      height: true,
      location: true,
      latitude: true,
      longitude: true,
      interests: true,
      photos: true,
      isProfileComplete: true,
      isVip: true,
      vipUntil: true,
      isEmailVerified: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user) {
    user.interests = parseJsonField(user.interests);
    user.photos = parseJsonField(user.photos);
  }
  return user;
}

async function blockUser(blockerId, blockedId) {
  const blocker = Number(blockerId);
  const blocked = Number(blockedId);

  if (blocker === blocked) {
    const err = new Error('Không thể tự chặn chính mình');
    err.status = 400;
    throw err;
  }

  const existingBlock = await prisma.userBlock.findFirst({
    where: {
      blockerId: blocker,
      blockedId: blocked,
    },
  });

  if (existingBlock) {
    return existingBlock;
  }

  return prisma.userBlock.create({
    data: {
      blockerId: blocker,
      blockedId: blocked,
    },
  });
}

async function reportUser(reporterId, reportedId, reason) {
  const reporter = await prisma.user.findUnique({
    where: { userId: Number(reporterId) },
    select: { userId: true, role: true, isEmailVerified: true, isCitizenVerified: true },
  });

  if (reporter && reporter.role !== 'ADMIN' && (!reporter.isEmailVerified || !reporter.isCitizenVerified)) {
    const err = new Error('Tài khoản của bạn cần xác thực Email và Căn cước công dân (CCCD) đầy đủ mới có thể gửi báo cáo người dùng.');
    err.status = 403;
    throw err;
  }

  return prisma.report.create({
    data: {
      reporterId: Number(reporterId),
      reportedId: Number(reportedId),
      reason,
    },
  });
}

async function getBlockedUsers(userId) {
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: Number(userId) },
    include: {
      blocked: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return blocks.map(b => ({
    blockId: b.id,
    blockedUser: b.blocked,
    createdAt: b.createdAt,
  }));
}

async function unblockUser(blockerId, blockedId) {
  const blocker = Number(blockerId);
  const blocked = Number(blockedId);

  return prisma.userBlock.deleteMany({
    where: {
      blockerId: blocker,
      blockedId: blocked,
    },
  });
}

// ── Email Verification OTP ──
async function sendEmailVerificationCode(userId) {
  const user = await prisma.user.findUnique({ where: { userId: Number(userId) } });
  if (!user || !user.email) {
    const err = new Error('Không tìm thấy tài khoản người dùng hoặc email chưa được cấu hình');
    err.status = 404;
    throw err;
  }

  if (user.isEmailVerified) {
    const err = new Error('Email của bạn đã được xác thực trước đó rồi');
    err.status = 400;
    throw err;
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otpCode, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { userId: user.userId },
    data: {
      emailVerifyCode: otpHash,
      emailVerifyExp: expiresAt,
    },
  });

  try {
    await emailService.sendEmailVerificationOtp(user.email, otpCode);
  } catch (err) {
    console.warn('[Email Warning]: Could not send OTP email via SMTP:', err.message);
    console.log(`[DEV OTP Code for ${user.email}]:`, otpCode);
  }

  return { message: `Đã gửi mã xác thực tới ${user.email}. Mã có hiệu lực trong 10 phút.` };
}

async function verifyEmailCode(userId, code) {
  const user = await prisma.user.findUnique({ where: { userId: Number(userId) } });
  if (!user || !user.emailVerifyCode || !user.emailVerifyExp) {
    const err = new Error('Bạn chưa yêu cầu mã xác thực email hoặc mã đã hết hạn');
    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(user.emailVerifyExp)) {
    const err = new Error('Mã xác thực email đã hết hạn. Vui lòng yêu cầu mã mới.');
    err.status = 400;
    throw err;
  }

  const isValid = await bcrypt.compare(String(code).trim(), user.emailVerifyCode);
  if (!isValid) {
    const err = new Error('Mã xác thực OTP không chính xác. Vui lòng thử lại.');
    err.status = 400;
    throw err;
  }

  const updatedUser = await prisma.user.update({
    where: { userId: Number(userId) },
    data: {
      isEmailVerified: true,
      emailVerifyCode: null,
      emailVerifyExp: null,
    },
    select: {
      userId: true,
      isEmailVerified: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
    },
  });

  return {
    message: 'Xác thực địa chỉ Email thành công!',
    user: updatedUser,
  };
}

// ── Citizen Identity (CCCD) Verification Request ──
async function verifyCitizenIdentity(userId, { frontPhoto, backPhoto }) {
  if (!frontPhoto) {
    const err = new Error('Vui lòng tải lên ảnh mặt trước Căn cước công dân');
    err.status = 400;
    throw err;
  }
  if (!backPhoto) {
    const err = new Error('Vui lòng tải lên ảnh mặt sau Căn cước công dân');
    err.status = 400;
    throw err;
  }

  const updatedUser = await prisma.user.update({
    where: { userId: Number(userId) },
    data: {
      citizenFrontPhoto: frontPhoto,
      citizenBackPhoto: backPhoto,
      citizenVerificationStatus: 'PENDING',
      citizenRejectReason: null,
      isCitizenVerified: false,
    },
    select: {
      userId: true,
      isCitizenVerified: true,
      citizenVerificationStatus: true,
      citizenRejectReason: true,
      citizenFrontPhoto: true,
      citizenBackPhoto: true,
      citizenVerifiedAt: true,
    },
  });

  return {
    message: 'Đã gửi yêu cầu xác thực Căn cước công dân! Vui lòng chờ Quản trị viên xét duyệt.',
    citizenInfo: updatedUser,
  };
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  blockUser,
  reportUser,
  getBlockedUsers,
  unblockUser,
  sendEmailVerificationCode,
  verifyEmailCode,
  verifyCitizenIdentity,
};
