const prisma = require('./prismaClient');
const { hashPassword } = require('./password');

async function seedAdmin() {
  try {
    const adminEmail = 'admin@love.you';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await hashPassword('123456');
      await prisma.user.create({
        data: {
          username: 'admin',
          email: adminEmail,
          passwordHash,
          fullName: 'System Administrator',
          role: 'ADMIN',
          status: 'ACTIVE',
          isProfileComplete: true,
          bio: 'Hệ thống Quản trị viên LoveYou',
        },
      });
      console.log('✅ Default Admin account created: admin@love.you / 123456');
    }
  } catch (err) {
    console.error('⚠️ Could not seed admin account:', err.message);
  }
}

module.exports = seedAdmin;
