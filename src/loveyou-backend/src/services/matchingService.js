const prisma = require('../utils/prismaClient');

const SYSTEM_BOT_CANDIDATES = [
  {
    id: -1,
    name: 'Mai Phương',
    age: 22,
    location: 'TP. Hồ Chí Minh • 3 km',
    bio: 'Yêu âm nhạc, thích đi cafe chill cuối tuần và chụp ảnh phim 📸✨',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    tags: ['🎵 Music', '☕ Coffee', '📸 Photography'],
  },
  {
    id: -2,
    name: 'Thanh Hằng',
    age: 24,
    location: 'Hà Nội • 5 km',
    bio: 'Gym, yoga và lối sống lành mạnh. Đang tìm một người cùng tập luyện 🏋️‍♀️🧘‍♀️',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    tags: ['🏋️ Gym', '🧘 Yoga', '✈️ Travel'],
  },
  {
    id: -3,
    name: 'Bảo Ngọc',
    age: 23,
    location: 'Đà Nẵng • 2 km',
    bio: 'Đam mê du lịch và ẩm thực. Thích nuôi mèo 🐱 và nấu ăn 🍳',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    tags: ['✈️ Travel', '🐱 Pets', '🍳 Cooking'],
  },
  {
    id: -4,
    name: 'Minh Anh',
    age: 25,
    location: 'TP. Hồ Chí Minh • 7 km',
    bio: 'Software engineer 💻 thích chơi game 🎮 và xem phim chiếu rạp 🎬',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    tags: ['💻 Coding', '🎮 Gaming', '🎬 Movies'],
  },
  {
    id: -5,
    name: 'Hoàng Nam',
    age: 26,
    location: 'TP. Hồ Chí Minh • 4 km',
    bio: 'Nhiếp ảnh tự do 📸 yêu cắm trại và khám phá những vùng đất mới 🏕️',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    tags: ['📸 Photography', '✈️ Travel', '☕ Coffee'],
  },
  {
    id: -6,
    name: 'Thu Thảo',
    age: 21,
    location: 'TP. Hồ Chí Minh • 2 km',
    bio: 'Sinh viên Mỹ thuật 🎨 yêu vẽ tranh, hòa mình vào thiên nhiên 🌿',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    tags: ['🎨 Art', '📚 Books', '☕ Coffee'],
  },
  {
    id: -7,
    name: 'Đức Minh',
    age: 27,
    location: 'Hà Nội • 6 km',
    bio: 'Kiến trúc sư 📐 đam mê thiết kế không gian và đánh đàn guitar 🎸',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    tags: ['🎨 Art', '🎵 Music', '☕ Coffee'],
  },
  {
    id: -8,
    name: 'Khánh Linh',
    age: 23,
    location: 'Cần Thơ • 8 km',
    bio: 'Fashion designer 👗 đam mê thời trang đương đại và phim chiếu rạp 🎬',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600',
    tags: ['🎬 Movies', '🎨 Art', '✈️ Travel'],
  },
  {
    id: -9,
    name: 'Gia Huy',
    age: 25,
    location: 'Đà Nẵng • 3 km',
    bio: 'HLV Fitness 🏋️‍♂️ yêu các môn thể thao outdoor và leo núi 🏔️',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    tags: ['🏋️ Gym', '⚽ Sports', '✈️ Travel'],
  },
  {
    id: -10,
    name: 'Phương Thảo',
    age: 24,
    location: 'TP. Hồ Chí Minh • 5 km',
    bio: 'Marketing executive 💼 thích du lịch biển và làm bánh pastry 🍰',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    tags: ['🍳 Cooking', '✈️ Travel', '☕ Coffee'],
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
        location: u.location ? `${u.location} • 3 km` : 'TP. Hồ Chí Minh • 3 km',
        bio: u.bio || 'Chưa thêm tiểu sử giới thiệu',
        photo: primaryPhoto,
        tags: parseJsonField(u.interests),
      };
    });
  } catch {
    /* fallback */
  }

  // 3. Filter system bots that haven't been swiped yet
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
      // Randomly select 2-3 bots (e.g. -1, -3, -7) to trigger a mutual match!
      const randomMatchBotIds = [-1, -3, -7];
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
        },
      });

      if (targetUserObj) {
        const photosList = parseJsonField(targetUserObj.photos);
        matchedUser = {
          id: targetUserObj.userId,
          name: targetUserObj.fullName || targetUserObj.username,
          age: calculateAge(targetUserObj.dateOfBirth),
          photo: photosList[0] || targetUserObj.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
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
        user1: { select: { userId: true, username: true, fullName: true, profilePicture: true, photos: true, dateOfBirth: true } },
        user2: { select: { userId: true, username: true, fullName: true, profilePicture: true, photos: true, dateOfBirth: true } },
      },
    });

    return matchRecords.map(m => {
      const partner = m.user1Id === currentUserId ? m.user2 : m.user1;
      const photosList = parseJsonField(partner.photos);
      return {
        id: partner.userId,
        name: partner.fullName || partner.username,
        age: calculateAge(partner.dateOfBirth),
        photo: photosList[0] || partner.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
        matchedAt: m.createdAt,
      };
    });
  } catch {
    return [];
  }
}

module.exports = {
  getCandidates,
  handleSwipe,
  getUserMatches,
};
