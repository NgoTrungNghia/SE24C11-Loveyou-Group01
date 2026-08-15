const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().max(100, 'Full name cannot exceed 100 characters').optional().nullable(),
  phoneNumber: z.string().max(20, 'Phone number cannot exceed 20 characters').optional().nullable(),
  gender: z.string().max(10, 'Gender cannot exceed 10 characters').optional().nullable(),
  dateOfBirth: z.string().refine((val) => {
    if (!val) return true;
    const dob = new Date(val);
    const today = new Date();
    if (dob > today) return false;
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18 && age <= 100;
  }, { message: 'Ngày sinh không hợp lệ (Phải từ 18 đến 100 tuổi và không thuộc tương lai)' }).optional().nullable(),
  profilePicture: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  height: z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    if (isNaN(n)) return null;
    if (n > 0 && n < 3) return Math.round(n * 100);
    return n;
  }, z.number().min(50).max(250).optional().nullable()),
  location: z.string().max(255).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  photos: z.array(z.string()).max(5, 'Maximum 5 photos allowed').optional().nullable(),
  isProfileComplete: z.boolean().optional(),
});

module.exports = {
  updateProfileSchema,
};
