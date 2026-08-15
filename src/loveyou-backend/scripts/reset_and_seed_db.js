const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prismaClient');

const ADMIN_ACCOUNTS = [
  {
    username: 'admin1',
    email: 'admin1@gmail.com',
    fullName: 'Quản Trị Viên 1 (Admin 1)',
    gender: 'female',
    role: 'ADMIN',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Ban Quản Trị Hệ Thống LoveYou (Admin 1) 👑 - Hỗ trợ người dùng 24/7',
    location: 'TP. Hồ Chí Minh',
    latitude: 10.762622,
    longitude: 106.660172,
    interests: JSON.stringify(['👑 Admin', '💻 Công nghệ', '🎧 Hỗ trợ']),
    isProfileComplete: true,
    isEmailVerified: true,
    isCitizenVerified: true,
  },
  {
    username: 'admin2',
    email: 'admin2@gmail.com',
    fullName: 'Quản Trị Viên 2 (Admin 2)',
    gender: 'male',
    role: 'ADMIN',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Ban Quản Trị Hệ Thống LoveYou (Admin 2) 👑 - Kiểm duyệt nội dung & hỗ trợ khách hàng',
    location: 'Hà Nội',
    latitude: 21.0285,
    longitude: 105.8542,
    interests: JSON.stringify(['👑 Admin', '🛡️ Bảo mật', '☕ Cà phê']),
    isProfileComplete: true,
    isEmailVerified: true,
    isCitizenVerified: true,
  },
];

const USER_ACCOUNTS = [
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
    interests: JSON.stringify(['🎵 Âm nhạc', '☕ Cà phê', '📸 Nhiếp ảnh', '🧋 Trà sữa']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['🎵 Âm nhạc', '☕ Cà phê', '📸 Nhiếp ảnh']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['🏋️ Tập gym', '🧘 Yoga', '✈️ Du lịch']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['✈️ Du lịch', '🐱 Thú cưng', '🍳 Nấu ăn']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['💻 Lập trình', '🎮 Chơi game', '🎬 Xem phim']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['⚽ Thể thao', '✈️ Du lịch', '🎸 Guitar']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['📸 Nhiếp ảnh', '✈️ Du lịch', '☕ Cà phê']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['📐 Kiến trúc', '🎷 Nhạc Jazz', '☕ Cà phê']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['📚 Đọc sách', '🥐 Làm bánh', '🌸 Phim Anime']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
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
    interests: JSON.stringify(['🚀 Khởi nghiệp', '🏃 Chạy bộ', '💻 Công nghệ']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test11',
    email: 'test11@gmail.com',
    fullName: 'Linh Chi',
    gender: 'female',
    dateOfBirth: new Date('2003-04-18'),
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Sinh viên Ngoại thương 🎓 yêu thích tiếng Anh, du lịch bụi và podcast 🎧',
    height: 162,
    location: 'Hà Nội',
    latitude: 21.0333,
    longitude: 105.8500,
    interests: JSON.stringify(['🎓 Ngoại ngữ', '🎧 Nghe Podcast', '✈️ Du lịch']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test12',
    email: 'test12@gmail.com',
    fullName: 'Quốc Bảo',
    gender: 'male',
    dateOfBirth: new Date('1999-09-14'),
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Bác sĩ thú y 🐶🐱 yêu động vật, thích cắm trại và đàn guitar 🎸',
    height: 177,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.7800,
    longitude: 106.6900,
    interests: JSON.stringify(['🐶 Yêu cún', '🐱 Yêu mèo', '🎸 Guitar', '🏕️ Cắm trại']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test13',
    email: 'test13@gmail.com',
    fullName: 'Khánh Vy',
    gender: 'female',
    dateOfBirth: new Date('2001-12-03'),
    profilePicture: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Content creator & MC sự kiện 🎤 thích thời trang, bơi lội và ẩm thực đường phố 🍲',
    height: 166,
    location: 'Đà Nẵng',
    latitude: 16.0600,
    longitude: 108.2100,
    interests: JSON.stringify(['🎤 Ca hát/MC', '🏊 Bơi lội', '🍲 Ẩm thực']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test14',
    email: 'test14@gmail.com',
    fullName: 'Tuấn Kiệt',
    gender: 'male',
    dateOfBirth: new Date('1998-08-28'),
    profilePicture: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Kỹ sư AI & Cloud ☁️ thích chạy bộ marathon 🏃 và đọc sách khoa học viễn tưởng 🌌',
    height: 179,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.8000,
    longitude: 106.6500,
    interests: JSON.stringify(['🤖 Trí tuệ AI', '🏃 Marathon', '🌌 Khoa học viễn tưởng']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test15',
    email: 'test15@gmail.com',
    fullName: 'Quỳnh Nga',
    gender: 'female',
    dateOfBirth: new Date('2000-10-10'),
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Giáo viên Tiếng Anh 👩‍🏫 thích cắm hoa 💐, nghe nhạc acoustic và đi dạo hồ Tây 🚲',
    height: 163,
    location: 'Hà Nội',
    latitude: 21.0400,
    longitude: 105.8300,
    interests: JSON.stringify(['💐 Cắm hoa', '🎵 Nhạc Acoustic', '🚲 Đạp xe']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test16',
    email: 'test16@gmail.com',
    fullName: 'Hải Đăng',
    gender: 'male',
    dateOfBirth: new Date('1999-03-22'),
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Graphic Designer 🎨 mê truyện tranh, boardgame 🎲 và leo núi trong nhà 🧗‍♂️',
    height: 174,
    location: 'Hà Nội',
    latitude: 21.0100,
    longitude: 105.8200,
    interests: JSON.stringify(['🎨 Thiết kế đồ họa', '🎲 Boardgame', '🧗 Leo núi']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test17',
    email: 'test17@gmail.com',
    fullName: 'Diệu Linh',
    gender: 'female',
    dateOfBirth: new Date('2002-02-14'),
    profilePicture: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Barista & Coffee Enthusiast ☕ thích làm bánh mì sourdough và nghe nhạc Lofi 📻',
    height: 161,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.7900,
    longitude: 106.6800,
    interests: JSON.stringify(['☕ Cà phê', '🍞 Làm bánh mì', '📻 Nhạc Lofi']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test18',
    email: 'test18@gmail.com',
    fullName: 'Gia Huy',
    gender: 'male',
    dateOfBirth: new Date('2000-11-25'),
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Personal Trainer 🏋️‍♂️ đam mê thể hình, dinh dưỡng healthy và bóng rổ 🏀',
    height: 182,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.7500,
    longitude: 106.6700,
    interests: JSON.stringify(['🏋️ Thể hình', '🏀 Bóng rổ', '🥗 Ăn Healthy']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test19',
    email: 'test19@gmail.com',
    fullName: 'Phương Thảo',
    gender: 'female',
    dateOfBirth: new Date('2001-06-30'),
    profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Họa sĩ minh họa tự do 🎨 yêu biển 🌊 ngắm hoàng hôn và uống trà sen 🍵',
    height: 165,
    location: 'Đà Nẵng',
    latitude: 16.0700,
    longitude: 108.2200,
    interests: JSON.stringify(['🎨 Hội họa', '🌊 Đi biển', '🍵 Thưởng trà']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
  {
    username: 'test20',
    email: 'test20@gmail.com',
    fullName: 'Minh Khang',
    gender: 'male',
    dateOfBirth: new Date('1998-05-05'),
    profilePicture: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    ]),
    bio: 'Chuyên viên phân tích tài chính 📈 thích chơi tennis 🎾 đọc sách lịch sử 📚 và du lịch châu Âu ✈️',
    height: 178,
    location: 'TP. Hồ Chí Minh',
    latitude: 10.7700,
    longitude: 106.7000,
    interests: JSON.stringify(['📈 Tài chính', '🎾 Tennis', '📚 Lịch sử', '✈️ Du lịch']),
    isProfileComplete: false,
    isEmailVerified: false,
    isCitizenVerified: false,
  },
];

async function resetAndSeedDatabase() {
  console.log('🔄 Đang xóa toàn bộ dữ liệu người dùng cũ trong database...');

  // Cascade delete all users and related tables
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE users CASCADE;');
  } catch (_e) {
    await prisma.supportMessage.deleteMany({}).catch(() => { });
    await prisma.supportConversation.deleteMany({}).catch(() => { });
    await prisma.payment.deleteMany({}).catch(() => { });
    await prisma.userConversationClear.deleteMany({}).catch(() => { });
    await prisma.userBlock.deleteMany({}).catch(() => { });
    await prisma.report.deleteMany({}).catch(() => { });
    await prisma.message.deleteMany({}).catch(() => { });
    await prisma.conversation.deleteMany({}).catch(() => { });
    await prisma.match.deleteMany({}).catch(() => { });
    await prisma.swipe.deleteMany({}).catch(() => { });
    await prisma.userPreferences.deleteMany({}).catch(() => { });
    await prisma.passwordResetToken.deleteMany({}).catch(() => { });
    await prisma.user.deleteMany({}).catch(() => { });
  }

  console.log('✨ Đã dọn sạch database!');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo 2 tài khoản ADMIN
  console.log('\n👑 Đang tạo 2 tài khoản ADMIN (admin1@gmail.com, admin2@gmail.com)...');
  for (const adm of ADMIN_ACCOUNTS) {
    const createdAdmin = await prisma.user.create({
      data: {
        username: adm.username,
        email: adm.email,
        passwordHash,
        fullName: adm.fullName,
        gender: adm.gender,
        role: 'ADMIN',
        status: 'ACTIVE',
        profilePicture: adm.profilePicture,
        photos: adm.photos,
        bio: adm.bio,
        location: adm.location,
        latitude: adm.latitude,
        longitude: adm.longitude,
        interests: adm.interests,
        isProfileComplete: false,
        isEmailVerified: false,
        isCitizenVerified: false,
      },
    });

    await prisma.userPreferences.create({
      data: {
        userId: createdAdmin.userId,
        genderPreference: 'all',
        minAge: 18,
        maxAge: 60,
        maxDistance: 100,
      },
    });

    console.log(`  ✅ Tạo thành công Admin: ${adm.username} (${adm.email}) - Mật khẩu: 123456`);
  }

  // 2. Tạo 20 tài khoản USER (test1@gmail.com -> test20@gmail.com)
  console.log('\n👤 Đang tạo 20 tài khoản USER (test1@gmail.com -> test20@gmail.com)...');
  for (const usr of USER_ACCOUNTS) {
    const createdUser = await prisma.user.create({
      data: {
        username: usr.username,
        email: usr.email,
        passwordHash,
        fullName: usr.fullName,
        gender: usr.gender,
        dateOfBirth: usr.dateOfBirth,
        role: 'USER',
        status: 'ACTIVE',
        profilePicture: usr.profilePicture,
        photos: usr.photos,
        bio: usr.bio,
        height: usr.height,
        location: usr.location,
        latitude: usr.latitude,
        longitude: usr.longitude,
        interests: usr.interests,
        isProfileComplete: false,
        isEmailVerified: false,
        isCitizenVerified: false,
        citizenIdNumber: null,
        citizenName: null,
        citizenDob: null,
        citizenGender: null,
        citizenAddress: null,
        citizenIssueDate: null,
        citizenFrontPhoto: null,
        citizenBackPhoto: null,
        citizenVerifiedAt: null,
      },
    });

    await prisma.userPreferences.create({
      data: {
        userId: createdUser.userId,
        genderPreference: 'all',
        minAge: 18,
        maxAge: 45,
        maxDistance: 50,
      },
    });

    console.log(`  ✅ Tạo thành công User: ${usr.username} (${usr.email}) [${usr.fullName}] - Mật khẩu: 123456`);
  }

  console.log('\n🎉 Hoàn thành khởi tạo lại Database!');
  console.log('==============================================');
  console.log('🔑 TỔNG HỢP TÀI KHOẢN (Mật khẩu chung: 123456):');
  console.log('👑 2 Admin:');
  console.log('   - admin1@gmail.com (username: admin1)');
  console.log('   - admin2@gmail.com (username: admin2)');
  console.log('👤 20 Users:');
  console.log('   - test1@gmail.com -> test20@gmail.com (username: test1 -> test20)');
  console.log('==============================================\n');
}

if (require.main === module) {
  resetAndSeedDatabase()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('❌ Lỗi khi khởi tạo lại database:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { resetAndSeedDatabase, ADMIN_ACCOUNTS, USER_ACCOUNTS };
