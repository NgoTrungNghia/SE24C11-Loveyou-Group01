const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().max(100, 'Full name cannot exceed 100 characters').optional().nullable(),
  phoneNumber: z.string().max(20, 'Phone number cannot exceed 20 characters').optional().nullable(),
  gender: z.string().max(10, 'Gender cannot exceed 10 characters').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  profilePicture: z.string().max(255, 'Image URL cannot exceed 255 characters').optional().nullable(),
  bio: z.string().optional().nullable(),
  height: z.number().min(100).max(250).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  photos: z.array(z.string()).max(5, 'Maximum 5 photos allowed').optional().nullable(),
  isProfileComplete: z.boolean().optional(),
});

module.exports = {
  updateProfileSchema,
};
