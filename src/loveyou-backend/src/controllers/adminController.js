const adminService = require('../services/adminService');
const { success } = require('./baseController');

async function getStats(req, res, next) {
  try {
    const stats = await adminService.getStats();
    return success(res, { stats });
  } catch (err) {
    return next(err);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const chatService = require('../services/chatService');
    const currentAdminId = Number(req.user.userId);
    if (currentAdminId) {
      await chatService.updateLastActive(currentAdminId);
    }

    const onlineUsersMap = req.app.get('onlineUsers');
    const onlineSet = new Set(
      onlineUsersMap ? Array.from(onlineUsersMap.keys()).map(id => Number(id)) : []
    );
    if (currentAdminId) onlineSet.add(currentAdminId);

    const users = await adminService.getAllUsers();
    const usersWithOnline = users.map(u => ({
      ...u,
      isOnline: onlineSet.has(Number(u.userId)),
    }));
    return success(res, { users: usersWithOnline });
  } catch (err) {
    return next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'NOT_FOUND' },
      });
    }
    return success(res, { user });
  } catch (err) {
    return next(err);
  }
}

async function toggleBanStatus(req, res, next) {
  try {
    const updatedUser = await adminService.toggleBanStatus(req.user.userId, req.params.id);

    // If target user was BANNED, notify them in realtime via Socket.io
    if (updatedUser.status === 'BANNED') {
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      if (io && onlineUsers) {
        const targetSockets = onlineUsers.get(updatedUser.userId);
        if (targetSockets) {
          targetSockets.forEach(socketId => {
            io.to(socketId).emit('account_banned', {
              message: 'Tài khoản của bạn đã bị khóa, vui lòng sử dụng tài khoản khác',
            });
          });
        }
      }
    }

    return success(res, {
      message: `User ${updatedUser.status === 'BANNED' ? 'banned' : 'unbanned'} successfully`,
      user: updatedUser,
    });
  } catch (err) {
    return next(err);
  }
}

async function getReports(req, res, next) {
  try {
    const reports = await adminService.getReports();
    return success(res, { reports });
  } catch (err) {
    return next(err);
  }
}

async function updateReportStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const report = await adminService.updateReportStatus(id, status, resolution);
    return success(res, { report });
  } catch (err) {
    return next(err);
  }
}

async function getApiKey(req, res, next) {
  try {
    const data = await adminService.getGeminiApiKeyForAdmin();
    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function setApiKey(req, res, next) {
  try {
    const { key } = req.body;
    const result = await adminService.setGeminiApiKeyAdmin(key);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getCitizenVerifications(req, res, next) {
  try {
    const verifications = await adminService.getCitizenVerifications();
    return success(res, { verifications });
  } catch (err) {
    return next(err);
  }
}

async function approveCitizenVerification(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await adminService.approveCitizenVerification(userId);

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(Number(userId), 'citizen_verification_result', {
        status: 'APPROVED',
        message: '🎉 Chúc mừng! Căn cước công dân của bạn đã được Quản trị viên phê duyệt thành công.',
      });
    }

    return success(res, {
      message: 'Đã duyệt xác thực Căn cước công dân thành công!',
      user,
    });
  } catch (err) {
    return next(err);
  }
}

async function rejectCitizenVerification(req, res, next) {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await adminService.rejectCitizenVerification(userId, reason);

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(Number(userId), 'citizen_verification_result', {
        status: 'REJECTED',
        reason: reason || 'Ảnh chụp CCCD không rõ ràng hoặc không hợp lệ',
        message: `Xác thực CCCD thất bại! ${reason ? 'Lý do: ' + reason : 'Vui lòng kiểm tra lại ảnh chụp và gửi lại.'}`,
      });
    }

    return success(res, {
      message: 'Đã từ chối xác thực Căn cước công dân!',
      user,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getStats,
  getAllUsers,
  getUserById,
  toggleBanStatus,
  getReports,
  updateReportStatus,
  getApiKey,
  setApiKey,
  getCitizenVerifications,
  approveCitizenVerification,
  rejectCitizenVerification,
};

