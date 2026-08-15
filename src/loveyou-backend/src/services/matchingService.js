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

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatLocationWithDistance(currentUser, targetUser) {
  const loc = targetUser?.location || 'Việt Nam';
  if (currentUser?.latitude && currentUser?.longitude && targetUser?.latitude && targetUser?.longitude) {
    const dist = haversineDistance(currentUser.latitude, currentUser.longitude, targetUser.latitude, targetUser.longitude);
    if (dist !== null) {
      if (dist <= 0) return loc;
      return `${loc} • cách ${dist} km`;
    }
  }
  return loc;
}

/**
 * Lấy danh sách ứng viên (Real User Accounts trong CSDL) ngoại trừ bản thân và những người đã quẹt/bị chặn
 */
async function getCandidates(userId) {
  const currentUserId = Number(userId);

  const currentUser = await prisma.user.findUnique({
    where: { userId: currentUserId },
    select: { latitude: true, longitude: true },
  });

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: currentUserId },
  });

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
    const whereClause = {
      userId: { notIn: swipedTargetIds },
      status: 'ACTIVE',
      role: { not: 'ADMIN' },
    };

    if (prefs?.genderPreference && prefs.genderPreference !== 'all') {
      whereClause.gender = { equals: prefs.genderPreference, mode: 'insensitive' };
    }

    const usersInDb = await prisma.user.findMany({
      where: whereClause,
      take: 50,
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
        latitude: true,
        longitude: true,
        interests: true,
        photos: true,
        isVip: true,
        isCitizenVerified: true,
        isEmailVerified: true,
        citizenVerificationStatus: true,
      },
    });

    const filteredUsers = usersInDb.filter(u => {
      const age = calculateAge(u.dateOfBirth);
      const minAge = prefs?.minAge ?? 18;
      const maxAge = prefs?.maxAge ?? 100;
      if (age < minAge || age > maxAge) return false;

      if (prefs?.maxDistance && currentUser?.latitude && currentUser?.longitude && u.latitude && u.longitude) {
        const dist = haversineDistance(currentUser.latitude, currentUser.longitude, u.latitude, u.longitude);
        if (dist !== null && dist > prefs.maxDistance) return false;
      }
      return true;
    });

    realCandidates = filteredUsers.map(u => {
      const photosList = parseJsonField(u.photos);
      const primaryPhoto = photosList[0] || u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
      return {
        id: u.userId,
        name: u.fullName || u.username,
        age: calculateAge(u.dateOfBirth),
        height: u.height || null,
        location: formatLocationWithDistance(currentUser, u),
        bio: u.bio || 'Chưa thêm tiểu sử giới thiệu',
        photo: primaryPhoto,
        photos: photosList.length > 0 ? photosList : [primaryPhoto],
        tags: parseJsonField(u.interests),
        isVip: Boolean(u.isVip),
        isCitizenVerified: Boolean(u.isCitizenVerified || u.citizenVerificationStatus === 'APPROVED'),
        isEmailVerified: Boolean(u.isEmailVerified),
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
          update: { isUnmatched: false, unmatchedBy: null },
          create: { user1Id: u1, user2Id: u2, isUnmatched: false },
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
          latitude: true,
          longitude: true,
          bio: true,
          interests: true,
          isVip: true,
          isCitizenVerified: true,
          isEmailVerified: true,
        },
      });

      const currentSwiperObj = await prisma.user.findUnique({
        where: { userId: currentSwiperId },
        select: { latitude: true, longitude: true },
      });

      if (targetUserObj) {
        const photosList = parseJsonField(targetUserObj.photos);
        matchedUser = {
          id: targetUserObj.userId,
          name: targetUserObj.fullName || targetUserObj.username,
          age: calculateAge(targetUserObj.dateOfBirth),
          height: targetUserObj.height || null,
          location: formatLocationWithDistance(currentSwiperObj, targetUserObj),
          bio: targetUserObj.bio || '',
          photo: photosList[0] || targetUserObj.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
          photos: photosList.length > 0 ? photosList : [targetUserObj.profilePicture],
          tags: parseJsonField(targetUserObj.interests),
          isVip: Boolean(targetUserObj.isVip),
          isCitizenVerified: Boolean(targetUserObj.isCitizenVerified),
          isEmailVerified: Boolean(targetUserObj.isEmailVerified),
        };
      }
    }
  }

  return { isMatch, matchedUser };
}

/**
 * Lấy danh sách Matches của user (chỉ lấy các match active, loại trừ match đã hủy)
 */
async function getUserMatches(userId) {
  const currentUserId = Number(userId);

  try {
    const currentUser = await prisma.user.findUnique({
      where: { userId: currentUserId },
      select: { latitude: true, longitude: true },
    });

    const matchRecords = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: currentUserId },
          { user2Id: currentUserId },
        ],
        isUnmatched: false,
      },
      include: {
        user1: { select: { userId: true, username: true, fullName: true, profilePicture: true, photos: true, dateOfBirth: true, height: true, location: true, latitude: true, longitude: true, bio: true, interests: true, isVip: true, isCitizenVerified: true, isEmailVerified: true } },
        user2: { select: { userId: true, username: true, fullName: true, profilePicture: true, photos: true, dateOfBirth: true, height: true, location: true, latitude: true, longitude: true, bio: true, interests: true, isVip: true, isCitizenVerified: true, isEmailVerified: true } },
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
    const givenSet = new Set(blocksGiven.map(b => b.blockedId));
    const receivedSet = new Set(blocksReceived.map(b => b.blockerId));

    return matchRecords.map(m => {
      const partner = m.user1Id === currentUserId ? m.user2 : m.user1;
      const photosList = parseJsonField(partner.photos);
      const isBlockedByMe = givenSet.has(partner.userId);
      const isBlockedByPartner = receivedSet.has(partner.userId);
      const isBlocked = isBlockedByMe || isBlockedByPartner;

      return {
        matchId: m.matchId,
        id: partner.userId,
        name: partner.fullName || partner.username,
        age: calculateAge(partner.dateOfBirth),
        height: partner.height || null,
        location: formatLocationWithDistance(currentUser, partner),
        bio: partner.bio || '',
        photo: photosList[0] || partner.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
        photos: photosList.length > 0 ? photosList : [partner.profilePicture],
        tags: parseJsonField(partner.interests),
        matchedAt: m.createdAt,
        isBlocked,
        isBlockedByMe,
        isBlockedByPartner,
        isVip: Boolean(partner.isVip),
        isCitizenVerified: Boolean(partner.isCitizenVerified),
        isEmailVerified: Boolean(partner.isEmailVerified),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Hủy ghép đôi giữa 2 tài khoản thực (Giữ lại cuộc trò chuyện và tin nhắn, chỉ đánh dấu isUnmatched)
 */
async function unmatchUser(currentUserId, targetId) {
  const userId = Number(currentUserId);
  const targetUserId = Number(targetId);

  try {
    // 1. Đánh dấu match đã hủy ghép đôi (không xóa Match / Conversation / Messages)
    await prisma.match.updateMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
      },
      data: {
        isUnmatched: true,
        unmatchedBy: userId,
      },
    });

    // 2. Xóa các lượt Swipe để 2 người có thể thấy nhau và quẹt lại nếu muốn
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

/**
 * Lấy danh sách "Ai đã tim mình" (Chỉ VIP mới xem được chi tiết, chưa VIP trả về mờ + số lượng)
 */
async function getWhoLikedMe(userId) {
  const currentUserId = Number(userId);

  const currentUser = await prisma.user.findUnique({
    where: { userId: currentUserId },
    select: { isVip: true, latitude: true, longitude: true },
  });

  const swipesReceived = await prisma.swipe.findMany({
    where: {
      targetId: currentUserId,
      action: { in: ['LIKE', 'SUPER_LIKE'] },
    },
    include: {
      swiper: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          dateOfBirth: true,
          profilePicture: true,
          photos: true,
          bio: true,
          location: true,
          latitude: true,
          longitude: true,
          interests: true,
          isVip: true,
          isCitizenVerified: true,
          isEmailVerified: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter out already matched users
  const matches = await getUserMatches(currentUserId);
  const matchedUserIds = new Set(matches.map(m => m.id));

  const filteredSwipes = swipesReceived.filter(s => !matchedUserIds.has(s.swiperId));
  const totalCount = filteredSwipes.length;
  const isVip = Boolean(currentUser?.isVip);

  if (!isVip) {
    return {
      isVip: false,
      totalCount,
      candidates: [],
    };
  }

  const candidates = filteredSwipes.map(s => {
    const u = s.swiper;
    const photosList = parseJsonField(u.photos);
    const primaryPhoto = photosList[0] || u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
    return {
      id: u.userId,
      name: u.fullName || u.username,
      age: calculateAge(u.dateOfBirth),
      location: formatLocationWithDistance(currentUser, u),
      bio: u.bio || '',
      photo: primaryPhoto,
      photos: photosList.length > 0 ? photosList : [primaryPhoto],
      tags: parseJsonField(u.interests),
      likedAt: s.createdAt,
      isVip: Boolean(u.isVip),
      isCitizenVerified: Boolean(u.isCitizenVerified),
      isEmailVerified: Boolean(u.isEmailVerified),
    };
  });

  return {
    isVip: true,
    totalCount,
    candidates,
  };
}

/**
 * Lấy danh sách "Mình đã tim ai"
 */
async function getWhoILiked(userId) {
  const currentUserId = Number(userId);

  const currentUser = await prisma.user.findUnique({
    where: { userId: currentUserId },
    select: { isVip: true },
  });

  const swipesSent = await prisma.swipe.findMany({
    where: {
      swiperId: currentUserId,
      action: { in: ['LIKE', 'SUPER_LIKE'] },
    },
    include: {
      target: {
        select: {
          userId: true,
          username: true,
          fullName: true,
          dateOfBirth: true,
          profilePicture: true,
          photos: true,
          bio: true,
          location: true,
          interests: true,
          isVip: true,
          isCitizenVerified: true,
          isEmailVerified: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCount = swipesSent.length;
  const isVip = Boolean(currentUser?.isVip);

  if (!isVip) {
    return {
      isVip: false,
      totalCount,
      candidates: [],
    };
  }

  const candidates = swipesSent.map(s => {
    const u = s.target;
    const photosList = parseJsonField(u.photos);
    const primaryPhoto = photosList[0] || u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
    return {
      id: u.userId,
      name: u.fullName || u.username,
      age: calculateAge(u.dateOfBirth),
      location: u.location ? `${u.location} • 3 km` : 'TP. Hồ Chí Minh • 3 km',
      bio: u.bio || '',
      photo: primaryPhoto,
      photos: photosList.length > 0 ? photosList : [primaryPhoto],
      tags: parseJsonField(u.interests),
      likedAt: s.createdAt,
      isVip: Boolean(u.isVip),
      isCitizenVerified: Boolean(u.isCitizenVerified),
      isEmailVerified: Boolean(u.isEmailVerified),
    };
  });

  return {
    isVip: true,
    totalCount,
    candidates,
  };
}

module.exports = {
  getCandidates,
  handleSwipe,
  getUserMatches,
  unmatchUser,
  getWhoLikedMe,
  getWhoILiked,
};

