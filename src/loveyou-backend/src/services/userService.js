const prisma = require('../utils/prismaClient');

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
  if (height !== undefined) updateData.height = height ? Number(height) : null;
  if (location !== undefined) updateData.location = location;
  if (interests !== undefined) updateData.interests = stringifyJsonField(interests);
  if (photos !== undefined) updateData.photos = stringifyJsonField(photos);
  if (isProfileComplete !== undefined) updateData.isProfileComplete = Boolean(isProfileComplete);

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
  '-1': { username: 'maiphuong', fullName: 'Mai Phương', email: 'maiphuong@demo.com', profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600' },
  '-2': { username: 'thanhhang', fullName: 'Thanh Hằng', email: 'thanhhang@demo.com', profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600' },
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

    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1Id: bId, user2Id: tId },
          { user1Id: tId, user2Id: bId },
        ],
      },
    });
  }

  return { message: 'Đã chặn tài khoản thành công' };
}

async function reportUser(reporterId, targetId, reason) {
  const rId = Number(reporterId);
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
        blockedUser: {
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
      .filter(b => b && b.blockedUser)
      .map(b => ({
        blockId: b.id,
        blockedAt: b.createdAt,
        user: b.blockedUser,
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

module.exports = {
  getUserProfile,
  updateUserProfile,
  blockUser,
  reportUser,
  getBlockedUsers,
  unblockUser,
};

