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

async function blockUser(req, res, next) {
  try {
    const userId = req.user.userId;
    const { targetId } = req.body;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Target user ID is required', code: 'INVALID_INPUT' },
      });
    }
    const result = await userService.blockUser(userId, targetId);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function reportUser(req, res, next) {
  try {
    const userId = req.user.userId;
    const { targetId, reason } = req.body;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Target user ID is required', code: 'INVALID_INPUT' },
      });
    }
    const result = await userService.reportUser(userId, targetId, reason);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getBlockedUsers(req, res, next) {
  try {
    const userId = req.user.userId;
    const blockedList = await userService.getBlockedUsers(userId);
    return success(res, { blockedUsers: blockedList });
  } catch (err) {
    return next(err);
  }
}

async function unblockUser(req, res, next) {
  try {
    const userId = req.user.userId;
    const { targetId } = req.body;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Target user ID is required', code: 'INVALID_INPUT' },
      });
    }
    const result = await userService.unblockUser(userId, targetId);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  blockUser,
  reportUser,
  getBlockedUsers,
  unblockUser,
};

