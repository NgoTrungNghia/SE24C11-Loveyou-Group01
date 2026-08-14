const prisma = require('../utils/prismaClient');

/**
 * Tính khoảng cách Haversine giữa 2 toạ độ (km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Tính AI Compatibility Score (0–100) giữa currentUser và candidate
 */
function calculateCompatibilityScore(currentUser, candidate, preferences) {
  let score = 25; // Base minimum score

  // 1. INTERESTS OVERLAP — Up to 35 points
  const myInterests = parseJson(currentUser.interests);
  const theirInterests = parseJson(candidate.interests);
  if (myInterests.length > 0 && theirInterests.length > 0) {
    const mySet = new Set(myInterests.map(i => i.toLowerCase().replace(/[^a-z0-9]/g, '')));
    const overlap = theirInterests.filter(i => mySet.has(i.toLowerCase().replace(/[^a-z0-9]/g, ''))).length;
    const maxPossible = Math.max(myInterests.length, theirInterests.length);
    score += Math.round((overlap / maxPossible) * 35);
  } else {
    score += 18; // Partial score if missing interests
  }

  // 2. DISTANCE PROXIMITY — Up to 25 points
  if (currentUser.latitude && currentUser.longitude && candidate.latitude && candidate.longitude) {
    const dist = haversineDistance(
      currentUser.latitude, currentUser.longitude,
      candidate.latitude, candidate.longitude
    );
    const maxDist = preferences?.maxDistance || 1500;
    if (dist <= 10) score += 25;
    else if (dist <= 50) score += 20;
    else if (dist <= 300) score += 15;
    else if (dist <= 1200) score += 10;
    else score += 5;
  } else {
    score += 15;
  }

  // 3. AGE PREFERENCE — Up to 15 points
  const candAge = calculateAge(candidate.dateOfBirth);
  const minAge = preferences?.minAge || 18;
  const maxAge = preferences?.maxAge || 45;
  if (candAge >= minAge && candAge <= maxAge) {
    score += 15;
  } else {
    score += 8;
  }

  // 4. ACTIVITY RECENCY — Up to 10 points
  if (candidate.lastActiveAt) {
    const hoursSinceActive = (Date.now() - new Date(candidate.lastActiveAt).getTime()) / 3600000;
    if (hoursSinceActive < 1) score += 10;
    else if (hoursSinceActive < 24) score += 8;
    else score += 5;
  } else {
    score += 7;
  }

  return Math.min(98, Math.max(68, Math.round(score)));
}

function parseJson(val) {
  if (!val) return [];
  try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; }
}

function calculateAge(dob) {
  if (!dob) return 22;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : 22;
}

/**
 * Lấy danh sách tài khoản thực được sắp xếp theo AI score
 */
async function getAICandidates(userId) {
  const uid = Number(userId);

  const currentUser = await prisma.user.findUnique({
    where: { userId: uid },
    include: { preferences: true },
  });
  if (!currentUser) return [];

  const prefs = currentUser.preferences;

  const swiped = await prisma.swipe.findMany({
    where: { swiperId: uid },
    select: { targetId: true },
  });
  const swipedIds = new Set([uid, ...swiped.map(s => s.targetId)]);

  let blockedIds = new Set();
  try {
    const blocks = await prisma.userBlock.findMany({
      where: { OR: [{ blockerId: uid }, { blockedId: uid }] },
      select: { blockerId: true, blockedId: true },
    });
    blocks.forEach(b => {
      blockedIds.add(b.blockerId);
      blockedIds.add(b.blockedId);
    });
  } catch { /* ignore */ }

  const excludeIds = Array.from(new Set([uid, ...swipedIds, ...blockedIds]));

  const where = {
    userId: { notIn: excludeIds },
    status: 'ACTIVE',
  };

  if (prefs?.genderPreference) {
    if (prefs.genderPreference !== 'all') {
      where.gender = prefs.genderPreference;
    }
  } else if (currentUser.gender) {
    where.gender = currentUser.gender === 'female' ? 'male' : 'female';
  }

  const realCandidates = await prisma.user.findMany({
    where,
    take: 50,
    select: {
      userId: true, username: true, fullName: true, gender: true,
      dateOfBirth: true, profilePicture: true, bio: true, height: true,
      location: true, latitude: true, longitude: true,
      interests: true, photos: true, lastActiveAt: true,
    },
  });

  const realScored = realCandidates.map(c => {
    const score = calculateCompatibilityScore(currentUser, c, prefs);
    const photosList = parseJson(c.photos);
    const primaryPhoto = photosList[0] || c.profilePicture || null;
    const dist = (currentUser.latitude && currentUser.longitude && c.latitude && c.longitude)
      ? Math.round(haversineDistance(currentUser.latitude, currentUser.longitude, c.latitude, c.longitude))
      : null;

    return {
      id: c.userId,
      name: c.fullName || c.username,
      age: calculateAge(c.dateOfBirth),
      height: c.height || null,
      location: dist !== null && dist > 0 ? `${c.location || 'Gần bạn'} • cách ${dist} km` : (c.location || 'TP. Hồ Chí Minh'),
      bio: c.bio || 'Chưa thêm tiểu sử giới thiệu',
      photo: primaryPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      photos: photosList.length > 0 ? photosList : [primaryPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'],
      tags: parseJson(c.interests),
      aiScore: score,
      distanceKm: dist,
    };
  });

  realScored.sort((a, b) => b.aiScore - a.aiScore);
  return realScored;
}

/**
 * Lấy hoặc tạo UserPreferences
 */
async function getUserPreferences(userId) {
  const uid = Number(userId);
  let prefs = await prisma.userPreferences.findUnique({ where: { userId: uid } });
  if (!prefs) {
    prefs = await prisma.userPreferences.create({
      data: { userId: uid, genderPreference: 'all', minAge: 18, maxAge: 45, maxDistance: 50 },
    });
  }
  return prefs;
}

async function updateUserPreferences(userId, data) {
  const uid = Number(userId);
  const { genderPreference, minAge, maxAge, maxDistance } = data;
  const updateData = {};
  if (genderPreference !== undefined) updateData.genderPreference = genderPreference;
  if (minAge !== undefined) updateData.minAge = Number(minAge);
  if (maxAge !== undefined) updateData.maxAge = Number(maxAge);
  if (maxDistance !== undefined) updateData.maxDistance = Number(maxDistance);

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: uid },
    update: updateData,
    create: { userId: uid, ...updateData },
  });
  return prefs;
}

module.exports = {
  getAICandidates,
  getUserPreferences,
  updateUserPreferences,
  calculateCompatibilityScore,
  haversineDistance,
  calculateAge,
};
