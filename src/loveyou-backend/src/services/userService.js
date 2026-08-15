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
      interests: true,
      photos: true,
      isProfileComplete: true,
      isVip: true,
      vipUntil: true,
      isEmailVerified: true,
      isCitizenVerified: true,
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
  const { fullName, phoneNumber, gender, dateOfBirth, profilePicture, bio, height, location, interests, photos, isProfileComplete } = profileData;
  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (gender !== undefined) updateData.gender = gender;
  if (dateOfBirth !== undefined) {
    updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  }
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
  if (bio !== undefined) updateData.bio = bio;
  if (height !== undefined) updateData.height = height;
  if (location !== undefined) updateData.location = location;
  if (interests !== undefined) updateData.interests = stringifyJsonField(interests);
  if (photos !== undefined) updateData.photos = stringifyJsonField(photos);
  if (isProfileComplete !== undefined) updateData.isProfileComplete = isProfileComplete;

  const updatedUser = await prisma.user.update({
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
      interests: true,
      photos: true,
      isProfileComplete: true,
      isVip: true,
      vipUntil: true,
      isEmailVerified: true,
      isCitizenVerified: true,
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

  if (updatedUser) {
    updatedUser.interests = parseJsonField(updatedUser.interests);
    updatedUser.photos = parseJsonField(updatedUser.photos);
  }
  return updatedUser;
}

const MOCK_DEMO_USERS = {
  '-1': { username: 'thuytrang', fullName: 'Thùy Trang', email: 'thuytrang@demo.com', profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600' },
  '-2': { username: 'lanhuong', fullName: 'Lan Hương', email: 'lanhuong@demo.com', profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600' },
  '-3': { username: 'baongoc', fullName: 'Bảo Ngọc', email: 'baongoc@demo.com', profilePicture: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600' },
  '-4': { username: 'minhanh', fullName: 'Minh Anh', email: 'minhanh@demo.com', profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600' },
  '-5': { username: 'hoangnam', fullName: 'Hoàng Nam', email: 'hoangnam@demo.com', profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600' },
};

async function ensureUserRecord(tId) {
  const targetId = Number(tId);
  if (targetId > 0) {
    return await prisma.user.findUnique({ where: { userId: targetId } });
  }

  const demoInfo = MOCK_DEMO_USERS[String(targetId)];
  if (!demoInfo) return null;

  let dbUser = await prisma.user.findUnique({ where: { email: demoInfo.email } });
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        username: demoInfo.username,
        email: demoInfo.email,
        fullName: demoInfo.fullName,
        profilePicture: demoInfo.profilePicture,
        passwordHash: '$2b$10$demoUserDummyHashForTestingOnly1234567890',
        isProfileComplete: true,
      },
    });
  }
  return dbUser;
}

async function blockUser(blockerId, targetId) {
  const bId = Number(blockerId);
  const targetUser = await ensureUserRecord(targetId);

  if (targetUser && targetUser.userId !== bId) {
    const tId = targetUser.userId;
    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: bId,
          blockedId: tId,
        },
      },
      update: {},
      create: {
        blockerId: bId,
        blockedId: tId,
      },
    });
  }

  return { message: 'Đã chặn tài khoản thành công' };
}

async function reportUser(reporterId, targetId, reason) {
  const rId = Number(reporterId);
  const reporter = await prisma.user.findUnique({ where: { userId: rId } });

  // Only allow admin OR fully verified users (isEmailVerified && isCitizenVerified) to report
  if (reporter && reporter.role !== 'ADMIN' && (!reporter.isEmailVerified || !reporter.isCitizenVerified)) {
    const err = new Error('Chỉ những tài khoản đã xác thực đầy đủ (Email & Căn cước công dân) mới có quyền gửi báo cáo người dùng.');
    err.status = 403;
    err.code = 'VERIFICATION_REQUIRED';
    throw err;
  }

  const targetUser = await ensureUserRecord(targetId);

  if (!targetUser) {
    return { message: 'Báo cáo thành công', reportId: 0 };
  }

  const report = await prisma.report.create({
    data: {
      reporterId: rId,
      reportedId: targetUser.userId,
      reason: String(reason || 'Báo cáo vi phạm'),
    },
  });

  return { message: 'Báo cáo thành công', reportId: report.id };
}

async function getBlockedUsers(blockerId) {
  const bId = Number(blockerId);
  if (!bId || isNaN(bId)) return [];
  try {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: bId },
      include: {
        blocked: {
          select: {
            userId: true,
            username: true,
            fullName: true,
            profilePicture: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return blocks
      .filter(b => b && b.blocked)
      .map(b => ({
        blockId: b.id,
        blockedAt: b.createdAt,
        user: b.blocked,
      }));
  } catch (err) {
    console.error('[getBlockedUsers Error]:', err.message);
    return [];
  }
}

async function unblockUser(blockerId, targetId) {
  const bId = Number(blockerId);
  const tId = Number(targetId);
  if (!bId || !tId || isNaN(bId) || isNaN(tId)) {
    return { message: 'Thao tác không hợp lệ' };
  }
  try {
    await prisma.userBlock.deleteMany({
      where: {
        blockerId: bId,
        blockedId: tId,
      },
    });
  } catch (err) {
    console.error('[unblockUser Error]:', err.message);
  }
  return { message: 'Đã bỏ chặn thành công' };
}

// ── Email Verification ──
async function sendEmailVerificationCode(userId) {
  const user = await prisma.user.findUnique({ where: { userId: Number(userId) } });
  if (!user || !user.email) {
    const err = new Error('Tài khoản không hợp lệ hoặc chưa có email');
    err.status = 400;
    throw err;
  }

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otpCode, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

  const isMatch = await bcrypt.compare(String(code).trim(), user.emailVerifyCode);
  if (!isMatch) {
    const err = new Error('Mã xác thực không chính xác. Vui lòng kiểm tra lại.');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.user.update({
    where: { userId: user.userId },
    data: {
      isEmailVerified: true,
      emailVerifyCode: null,
      emailVerifyExp: null,
    },
    select: {
      userId: true,
      email: true,
      isEmailVerified: true,
    },
  });

  return { message: 'Xác thực email thành công!', user: updated };
}

// ── Citizen Identity (CCCD) Verification ──
async function verifyCitizenIdentity(userId, { frontPhoto, backPhoto, qrData, parsedInfo }) {
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
  if (!qrData || typeof qrData !== 'string') {
    const err = new Error('Ảnh mặt trước không chứa mã QR hoặc không đọc được mã QR. Vui lòng chụp rõ nét góc trên bên phải CCCD.');
    err.status = 400;
    throw err;
  }

  const parts = qrData.split('|');
  if (parts.length < 5) {
    const err = new Error('Mã QR không đúng định dạng Căn cước công dân Việt Nam hợp lệ.');
    err.status = 400;
    throw err;
  }

  const cccdNumber = parts[0]?.trim();
  if (!/^\d{12}$/.test(cccdNumber)) {
    const err = new Error('Số căn cước công dân trên mã QR không đúng 12 chữ số theo quy định.');
    err.status = 400;
    throw err;
  }

  const citizenName = parts[2]?.trim() || parsedInfo?.fullName || '';
  const citizenDob = parts[3]?.trim() || parsedInfo?.dob || '';
  const citizenGender = parts[4]?.trim() || parsedInfo?.gender || '';
  const citizenAddress = parts[5]?.trim() || parsedInfo?.address || '';
  const citizenIssueDate = parts[6]?.trim() || parsedInfo?.issueDate || '';

  const updatedUser = await prisma.user.update({
    where: { userId: Number(userId) },
    data: {
      isCitizenVerified: true,
      citizenIdNumber: cccdNumber,
      citizenName,
      citizenDob,
      citizenGender,
      citizenAddress,
      citizenIssueDate,
      citizenFrontPhoto: frontPhoto,
      citizenBackPhoto: backPhoto,
      citizenVerifiedAt: new Date(),
    },
    select: {
      userId: true,
      isCitizenVerified: true,
      citizenIdNumber: true,
      citizenName: true,
      citizenDob: true,
      citizenGender: true,
      citizenAddress: true,
      citizenIssueDate: true,
      citizenVerifiedAt: true,
    },
  });

  return {
    message: 'Xác thực Căn cước công dân thành công!',
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
