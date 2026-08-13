const prisma = require('./src/utils/prismaClient');
const bcrypt = require('bcrypt');

const SEED_USERS = [
  {
    username: 'test1',
    email: 'test1@gmail.com',
    fullName: 'Hà My',
    gender: 'female',
    dateOfBirth: new Date('2002-05-15'),
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Thích đi du lịch, xem phim và uống trà sữa 🧋✨. Rất vui được làm quen!',
    height: 165,
    location: 'Hà Nội',
    latitude: 21.0285,
    longitude: 105.8542,
    interests: JSON.stringify(['🎵 Music', '☕ Coffee', '📸 Photography', '🧋 Boba']),
    isProfileComplete: true,
  },
  {
    username: 'test2',
    email: 'test2@gmail.com',
    fullName: 'Mai Phương',
    gender: 'female',
    dateOfBirth: new Date('2001-08-20'),
    profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Yêu âm nhạc, thích đi cafe chill cuối tuần và chụp ảnh phim 📸✨',
    height: 163,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.8231,
    longitude: 106.6297,
    interests: JSON.stringify(['🎵 Music', '☕ Coffee', '📸 Photography']),
    isProfileComplete: true,
  },
  {
    username: 'test3',
    email: 'test3@gmail.com',
    fullName: 'Thanh Hằng',
    gender: 'female',
    dateOfBirth: new Date('2000-03-12'),
    profilePicture: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Gym, yoga và lối sống lành mạnh. Đang tìm một người cùng tập luyện 🏋️‍♀️🧘‍♀️',
    height: 168,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.7769,
    longitude: 106.7009,
    interests: JSON.stringify(['🏋️ Gym', '🧘 Yoga', '✈️ Travel']),
    isProfileComplete: true,
  },
  {
    username: 'test4',
    email: 'test4@gmail.com',
    fullName: 'Bảo Ngọc',
    gender: 'female',
    dateOfBirth: new Date('2002-11-05'),
    profilePicture: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Đam mê du lịch và ẩm thực. Thích nuôi mèo 🐱 và nấu ăn 🍳',
    height: 162,
    location: 'Đà Nẵng',
    latitude: 16.0544,
    longitude: 108.2022,
    interests: JSON.stringify(['✈️ Travel', '🐱 Pets', '🍳 Cooking']),
    isProfileComplete: true,
  },
  {
    username: 'test5',
    email: 'test5@gmail.com',
    fullName: 'Minh Anh',
    gender: 'female',
    dateOfBirth: new Date('1999-07-25'),
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Software engineer 💻 thích chơi game 🎮 và xem phim chiếu rạp 🎬',
    height: 170,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.762622,
    longitude: 106.660172,
    interests: JSON.stringify(['💻 Coding', '🎮 Gaming', '🎬 Movies']),
    isProfileComplete: true,
  },
  {
    username: 'test6',
    email: 'test6@gmail.com',
    fullName: 'Quang Minh',
    gender: 'male',
    dateOfBirth: new Date('1998-02-14'),
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Thích thể thao, đá bóng cuối tuần ⚽ và đi du lịch phượt 🏔️',
    height: 175,
    location: 'Hà Nội',
    latitude: 21.0285,
    longitude: 105.8542,
    interests: JSON.stringify(['⚽ Sports', '✈️ Travel', '🎸 Guitar']),
    isProfileComplete: true,
  },
  {
    username: 'test7',
    email: 'test7@gmail.com',
    fullName: 'Hoàng Nam',
    gender: 'male',
    dateOfBirth: new Date('1999-10-30'),
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Nhiếp ảnh tự do 📸 yêu cắm trại và khám phá những vùng đất mới 🏕️',
    height: 178,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.8231,
    longitude: 106.6297,
    interests: JSON.stringify(['📸 Photography', '✈️ Travel', '☕ Coffee']),
    isProfileComplete: true,
  },
  {
    username: 'test8',
    email: 'test8@gmail.com',
    fullName: 'Đức Anh',
    gender: 'male',
    dateOfBirth: new Date('2000-06-18'),
    profilePicture: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Kiến trúc sư trẻ 📐 thích nghe nhạc Jazz 🎷 và pha cà phê thủ công ☕',
    height: 176,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.7769,
    longitude: 106.7009,
    interests: JSON.stringify(['📐 Architecture', '🎷 Jazz', '☕ Coffee']),
    isProfileComplete: true,
  },
  {
    username: 'test9',
    email: 'test9@gmail.com',
    fullName: 'Thu Trang',
    gender: 'female',
    dateOfBirth: new Date('2001-01-09'),
    profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Thích đọc sách 📚 làm bánh 🥐 và xem phim hoạt hình Ghibli 🌸',
    height: 164,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.762622,
    longitude: 106.660172,
    interests: JSON.stringify(['📚 Books', '🥐 Baking', '🌸 Ghibli']),
    isProfileComplete: true,
  },
  {
    username: 'test10',
    email: 'test10@gmail.com',
    fullName: 'Anh Tuấn',
    gender: 'male',
    dateOfBirth: new Date('1997-12-01'),
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Startup founder 🚀 yêu thích công nghệ, sách kinh doanh và chạy bộ 🏃‍♂️',
    height: 180,
    location: 'Đà Nẵng',
    latitude: 16.0544,
    longitude: 108.2022,
    interests: JSON.stringify(['🚀 Startup', '🏃‍♂️ Running', '💻 Tech']),
    isProfileComplete: true,
  },
];

const EXTRA_USERS = Array.from({ length: 20 }, (_, i) => {
  const num = i + 11;
  const isMale = num % 2 === 0;
  return {
    username: `test${num}`,
    email: `test${num}@gmail.com`,
    fullName: isMale ? `Nguyễn Văn ${num}` : `Trần Thị ${num}`,
    gender: isMale ? 'male' : 'female',
    dateOfBirth: new Date(2000, 0, 1),
    profilePicture: isMale ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      isMale ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'
    ]),
    bio: `Xin chào, mình là test${num}. Mình đang tìm kiếm một nửa của mình!`,
    height: isMale ? 175 : 160,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.8231 + (Math.random() * 0.1 - 0.05),
    longitude: 106.6297 + (Math.random() * 0.1 - 0.05),
    interests: JSON.stringify(['🎵 Music', '✈️ Travel', isMale ? '🎮 Gaming' : '☕ Coffee']),
    isProfileComplete: true,
  };
});

const ALL_USERS = [...SEED_USERS, ...EXTRA_USERS];

async function seedTestUsers() {
  const passwordHash = await bcrypt.hash('123456', 10);

  for (const u of ALL_USERS) {
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
      console.log(`✅ Seeded user ${u.username} (${u.email})`);
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
