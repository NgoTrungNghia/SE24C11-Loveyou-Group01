const prisma = require('../utils/prismaClient');

const SYSTEM_BOT_CANDIDATES = [
  {
    id: -1,
    name: 'Mai Phương',
    age: 22,
    location: 'TP. Hồ Chí Minh • 3 km',
    height: 165,
    bio: 'Yêu âm nhạc, thích đi cafe chill cuối tuần và chụp ảnh phim 📸✨. Đang tìm kiếm một tâm hồn đồng điệu để cùng đi xem hòa nhạc!',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['🎵 Music', '☕ Coffee', '📸 Photography'],
  },
  {
    id: -2,
    name: 'Thanh Hằng',
    age: 24,
    location: 'Hà Nội • 5 km',
    height: 168,
    bio: 'Gym, yoga và lối sống lành mạnh. Đang tìm một người cùng tập luyện 🏋️‍♀️🧘‍♀️',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['🏋️ Gym', '🧘 Yoga', '✈️ Travel'],
  },
  {
    id: -3,
    name: 'Bảo Ngọc',
    age: 23,
    location: 'Đà Nẵng • 2 km',
    height: 162,
    bio: 'Đam mê du lịch và ẩm thực. Thích nuôi mèo 🐱 và nấu ăn 🍳',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['✈️ Travel', '🐱 Pets', '🍳 Cooking'],
  },
  {
    id: -4,
    name: 'Minh Anh',
    age: 25,
    location: 'TP. Hồ Chí Minh • 7 km',
    height: 170,
    bio: 'Software engineer 💻 thích chơi game 🎮 và xem phim chiếu rạp 🎬',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['💻 Coding', '🎮 Gaming', '🎬 Movies'],
  },
  {
    id: -5,
    name: 'Hoàng Nam',
    age: 26,
    location: 'TP. Hồ Chí Minh • 4 km',
    height: 178,
    bio: 'Nhiếp ảnh tự do 📸 yêu cắm trại và khám phá những vùng đất mới 🏕️',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['📸 Photography', '✈️ Travel', '☕ Coffee'],
  },
];

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

async function getCandidates(userId) {
  const currentUserId = Number(userId);

  // 1. Get list of target user IDs already swiped by current user
  let swipedTargetIds = [currentUserId];
  try {
    const existingSwipes = await prisma.swipe.findMany({
      where: { swiperId: currentUserId },
      select: { targetId: true },
    });
    swipedTargetIds = swipedTargetIds.concat(existingSwipes.map(s => s.targetId));
  } catch {
    /* fallback */
  }

  // 2. Fetch real active users from Database (excluding current user & swiped users)
  let realCandidates = [];
  try {
    const usersInDb = await prisma.user.findMany({
      where: {
        userId: { notIn: swipedTargetIds },
        status: 'ACTIVE',
      },
      take: 20,
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

  // 3. Filter system bots (5 bots) that haven't been swiped yet
  const unswipedBots = SYSTEM_BOT_CANDIDATES.filter(bot => !swipedTargetIds.includes(bot.id));

  // Combine real candidates + unswiped bots
  return [...realCandidates, ...unswipedBots];
}

async function handleSwipe(swiperId, targetId, action) {
  const currentSwiperId = Number(swiperId);
  const currentTargetId = Number(targetId);

  // If target is bot (negative ID), simulate swipe response
  if (currentTargetId < 0) {
    try {
      await prisma.swipe.upsert({
        where: {
          swiperId_targetId: { swiperId: currentSwiperId, targetId: currentTargetId },
        },
        update: { action },
        create: { swiperId: currentSwiperId, targetId: currentTargetId, action },
      });
    } catch {
      /* ignore */
    }

    const botObj = SYSTEM_BOT_CANDIDATES.find(b => b.id === currentTargetId);
    if ((action === 'LIKE' || action === 'SUPER_LIKE') && botObj) {
      // Randomly select 1-2 bots (e.g. -1, -3) to trigger a mutual match
      const randomMatchBotIds = [-1, -3];
      const isMutualMatch = randomMatchBotIds.includes(currentTargetId);
      return {
        isMatch: isMutualMatch,
        matchedUser: isMutualMatch ? botObj : null,
        likedUser: !isMutualMatch ? botObj : null,
      };
    }
    return { isMatch: false, matchedUser: null, likedUser: null };
  }

  // Real user swipe logic
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

    return matchRecords.map(m => {
      const partner = m.user1Id === currentUserId ? m.user2 : m.user1;
      const photosList = parseJsonField(partner.photos);
      return {
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
      };
    });
  } catch {
    return [];
  }
}

async function unmatchUser(currentUserId, targetId) {
  const userId = Number(currentUserId);
  const targetUserId = Number(targetId);

  // If target is bot (negative ID), delete swipe record so bot reappears in deck
  if (targetUserId < 0) {
    try {
      await prisma.swipe.deleteMany({
        where: { swiperId: userId, targetId: targetUserId },
      });
    } catch {
      /* ignore */
    }
    return { success: true };
  }

  try {
    // 1. Delete match row from Match table
    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
      },
    });

    // 2. Delete ALL swipe records between both users from Swipe table
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
