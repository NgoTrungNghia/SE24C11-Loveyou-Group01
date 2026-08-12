const aiMatchingService = require('../services/aiMatchingService');
const { success } = require('./baseController');

async function getAICandidates(req, res, next) {
  try {
    const candidates = await aiMatchingService.getAICandidates(req.user.userId);
    return success(res, { candidates });
  } catch (err) { return next(err); }
}

async function getPreferences(req, res, next) {
  try {
    const prefs = await aiMatchingService.getUserPreferences(req.user.userId);
    return success(res, { preferences: prefs });
  } catch (err) { return next(err); }
}

async function updatePreferences(req, res, next) {
  try {
    const prefs = await aiMatchingService.updateUserPreferences(req.user.userId, req.body);
    return success(res, { preferences: prefs });
  } catch (err) { return next(err); }
}

module.exports = { getAICandidates, getPreferences, updatePreferences };
