const matchingService = require('../services/matchingService');
const { success } = require('./baseController');

async function getCandidates(req, res, next) {
  try {
    const userId = req.user.userId;
    const candidates = await matchingService.getCandidates(userId);
    return success(res, { candidates });
  } catch (err) {
    return next(err);
  }
}

async function swipe(req, res, next) {
  try {
    const swiperId = req.user.userId;
    const { targetId, action } = req.body;
    const result = await matchingService.handleSwipe(swiperId, targetId, action);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getMatches(req, res, next) {
  try {
    const userId = req.user.userId;
    const matches = await matchingService.getUserMatches(userId);
    return success(res, { matches });
  } catch (err) {
    return next(err);
  }
}

async function unmatch(req, res, next) {
  try {
    const userId = req.user.userId;
    const { targetId } = req.body;
    const result = await matchingService.unmatchUser(userId, targetId);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCandidates,
  swipe,
  getMatches,
  unmatch,
};
