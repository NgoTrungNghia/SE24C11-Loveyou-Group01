const prisma = require('../utils/prismaClient');

function parseJsonField(val) {
  if (!val) return [];
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return [];
  }
}

function calculateAge(dob) {
  if (!dob) return 22;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? age : 22;
}

/**
 * Lấy danh sách ứng viên (Real User Accounts trong CSDL) ngoại trừ bản thân và những người đã quẹt/bị chặn
 */
async function getCandidates(userId) {
  const currentUserId = Number(userId);

  let swipedTargetIds = [currentUserId];
  try {
    const existingSwipes = await prisma.swipe.findMany({
      where: { swiperId: currentUserId },
      select: { targetId: true },
    });
    const blocksGiven = await prisma.userBlock.findMany({
      where: { blockerId: currentUserId },
      select: { blockedId: true },
    });
    const blocksReceived = await prisma.userBlock.findMany({
      where: { blockedId: currentUserId },
      select: { blockerId: true },
    });
    const excludedIds = [
      currentUserId,
      ...existingSwipes.map(s => s.targetId),
      ...blocksGiven.map(b => b.blockedId),
      ...blocksReceived.map(b => b.blockerId),
    ];
    swipedTargetIds = Array.from(new Set(excludedIds));
  } catch {
    swipedTargetIds = [currentUserId];
  }

  let realCandidates = [];
  try {
    const usersInDb = await prisma.user.findMany({
      where: {
        userId: { notIn: swipedTargetIds },
        status: 'ACTIVE',
      },
      take: 30,
      select: {
        userId: true,
        username: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        profilePicture: true,
        bio: true,
        height: true,
        location: true,
        interests: true,
        photos: true,
      },
    });

    realCandidates = usersInDb.map(u => {
      const photosList = parseJsonField(u.photos);
      const primaryPhoto = photosList[0] || u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
      return {
        id: u.userId,
        name: u.fullName || u.username,
        age: calculateAge(u.dateOfBirth),
        height: u.height || null,
        location: u.location ? `${u.location} • 3 km` : 'TP. Hồ Chí Minh • 3 km',
        bio: u.bio || 'Chưa thêm tiểu sử giới thiệu',
        photo: primaryPhoto,
        photos: photosList.length > 0 ? photosList : [primaryPhoto],
        tags: parseJsonField(u.interests),
      };
    });
  } catch {
    /* fallback */
  }

  return realCandidates;
}

/**
 * Xử lý lượt swipe (LIKE/PASS/SUPER_LIKE) giữa 2 tài khoản thực
 */
async function handleSwipe(swiperId, targetId, action) {
  const currentSwiperId = Number(swiperId);
  const currentTargetId = Number(targetId);

  await prisma.swipe.upsert({
    where: {
      swiperId_targetId: {
        swiperId: currentSwiperId,
        targetId: currentTargetId,
      },
    },
    update: { action },
    create: {
      swiperId: currentSwiperId,
      targetId: currentTargetId,
      action,
    },
  });

  let isMatch = false;
  let matchedUser = null;

  if (action === 'LIKE' || action === 'SUPER_LIKE') {
    const reciprocalSwipe = await prisma.swipe.findUnique({
      where: {
        swiperId_targetId: {
          swiperId: currentTargetId,
          targetId: currentSwiperId,
        },
      },
    });

    if (reciprocalSwipe && (reciprocalSwipe.action === 'LIKE' || reciprocalSwipe.action === 'SUPER_LIKE')) {
      isMatch = true;
      const [u1, u2] = currentSwiperId < currentTargetId ? [currentSwiperId, currentTargetId] : [currentTargetId, currentSwiperId];

      try {
        await prisma.match.upsert({
          where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
          update: {},
          create: { user1Id: u1, user2Id: u2 },
        });
      } catch {
        /* ignore */
      }

      const targetUserObj = await prisma.user.findUnique({
        where: { userId: currentTargetId },
        select: {
          userId: true,
          username: true,
          fullName: true,
          profilePicture: true,
          photos: true,
          dateOfBirth: true,
          height: true,
          location: true,
          bio: true,
          interests: true,
        },
      });

      if (targetUserObj) {
        const photosList = parseJsonField(targetUserObj.photos);
        matchedUser = {
          id: targetUserObj.userId,
          name: targetUserObj.fullName || targetUserObj.username,
          age: calculateAge(targetUserObj.dateOfBirth),
          height: targetUserObj.height || null,
          location: targetUserObj.location ? `${targetUserObj.location} • 3 km` : 'TP. Hồ Chí Minh • 3 km',
          bio: targetUserObj.bio || '',
          photo: photosList[0] || targetUserObj.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
          photos: photosList.length > 0 ? photosList : [targetUserObj.profilePicture],
          tags: parseJsonField(targetUserObj.interests),
        };
      }
    }
  }

  return { isMatch, matchedUser };
}

/**
 * Lấy danh sách Matches của user (bao gồm cả khi bị chặn để không bị ẩn tin nhắn)
 */
async function getUserMatches(userId) {
  const currentUserId = Number(userId);

  try {
    const matchRecords = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: currentUserId },
          { user2Id: currentUserId },
        ],
      },
      include: {
        user1: { select: { userId: true, username: true, fullName: true, profilePicture: true, photos: true, dateOfBirth: true, height: true, location: true, bio: true, interests: true } },
        user2: { select: { userId: true, username: true, fullName: true, profilePicture: true, photos: true, dateOfBirth: true, height: true, location: true, bio: true, interests: true } },
      },
    });

    const blocksGiven = await prisma.userBlock.findMany({
      where: { blockerId: currentUserId },
      select: { blockedId: true },
    });
    const blocksReceived = await prisma.userBlock.findMany({
      where: { blockedId: currentUserId },
      select: { blockerId: true },
    });
    const blockedUserIds = new Set([
      ...blocksGiven.map(b => b.blockedId),
      ...blocksReceived.map(b => b.blockerId),
    ]);

    return matchRecords.map(m => {
      const partner = m.user1Id === currentUserId ? m.user2 : m.user1;
      const photosList = parseJsonField(partner.photos);
      return {
        matchId: m.matchId,
        id: partner.userId,
        name: partner.fullName || partner.username,
        age: calculateAge(partner.dateOfBirth),
        height: partner.height || null,
        location: partner.location ? `${partner.location} • 3 km` : 'TP. Hồ Chí Minh • 3 km',
        bio: partner.bio || '',
        photo: photosList[0] || partner.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
        photos: photosList.length > 0 ? photosList : [partner.profilePicture],
        tags: parseJsonField(partner.interests),
        matchedAt: m.createdAt,
        isBlocked: blockedUserIds.has(partner.userId),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Hủy ghép đôi giữa 2 tài khoản thực
 */
async function unmatchUser(currentUserId, targetId) {
  const userId = Number(currentUserId);
  const targetUserId = Number(targetId);

  try {
    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
      },
    });

    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { swiperId: userId, targetId: targetUserId },
          { swiperId: targetUserId, targetId: userId },
        ],
      },
    });
  } catch (err) {
    /* ignore */
  }

  return { success: true };
}

module.exports = {
  getCandidates,
  handleSwipe,
  getUserMatches,
  unmatchUser,
};
