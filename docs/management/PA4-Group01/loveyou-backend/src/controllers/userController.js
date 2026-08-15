const userService = require('../services/userService');
const { success } = require('./baseController');

async function getProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const profile = await userService.getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { message: 'User profile not found', code: 'NOT_FOUND' },
      });
    }
    return success(res, { profile });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const updatedProfile = await userService.updateUserProfile(userId, req.body);
    return success(res, { profile: updatedProfile });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
