const prisma = require('./src/utils/prismaClient');
const bcrypt = require('bcrypt');
const { USER_ACCOUNTS } = require('./scripts/reset_and_seed_db');

async function seedTestUsers() {
  const passwordHash = await bcrypt.hash('123456', 10);

  for (const u of USER_ACCOUNTS) {
    try {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          passwordHash,
          fullName: u.fullName,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
          profilePicture: u.profilePicture,
          photos: u.photos,
          bio: u.bio,
          height: u.height,
          location: u.location,
          latitude: u.latitude,
          longitude: u.longitude,
          interests: u.interests,
          isProfileComplete: true,
          isEmailVerified: u.isEmailVerified,
          isCitizenVerified: u.isCitizenVerified,
          status: 'ACTIVE',
        },
        create: {
          username: u.username,
          email: u.email,
          passwordHash,
          fullName: u.fullName,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
          profilePicture: u.profilePicture,
          photos: u.photos,
          bio: u.bio,
          height: u.height,
          location: u.location,
          latitude: u.latitude,
          longitude: u.longitude,
          interests: u.interests,
          isProfileComplete: true,
          isEmailVerified: u.isEmailVerified,
          isCitizenVerified: u.isCitizenVerified,
          status: 'ACTIVE',
        },
      });

      await prisma.userPreferences.upsert({
        where: { userId: user.userId },
        update: {},
        create: {
          userId: user.userId,
          genderPreference: 'all',
          minAge: 18,
          maxAge: 45,
          maxDistance: 50,
        },
      });
    } catch (err) {
      console.error(`❌ Error seeding ${u.username}:`, err.message);
    }
  }
}

if (require.main === module) {
  seedTestUsers().then(() => {
    console.log('🎉 Seed test users completed!');
    process.exit(0);
  });
}

module.exports = { seedTestUsers };
