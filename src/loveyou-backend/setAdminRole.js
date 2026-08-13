require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

const email = process.argv[2];

if (!email) {
  console.log('Usage: node setAdminRole.js <user-email>');
  process.exit(1);
}

async function setAdmin() {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Success! Account ${email} (ID #${user.userId}) has been granted ADMIN role!`);
  } catch (err) {
    console.error('⚠️ Error setting admin role:', err.message);
  } finally {
    process.exit(0);
  }
}

setAdmin();
