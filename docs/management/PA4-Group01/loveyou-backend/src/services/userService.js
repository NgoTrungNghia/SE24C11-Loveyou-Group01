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

module.exports = {
  getUserProfile,
  updateUserProfile,
};
