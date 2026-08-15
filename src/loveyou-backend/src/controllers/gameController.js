const gameService = require('../services/gameService');
const { success } = require('./baseController');

async function createGame(req, res, next) {
  try {
    const { gameType, partnerId, matchId } = req.body;
    if (!gameType || !partnerId || !matchId) {
      return res.status(400).json({ success: false, error: { message: 'gameType, partnerId, matchId are required' } });
    }
    const session = gameService.createGameSession(gameType, req.user.userId, partnerId, matchId);
    return success(res, { session });
  } catch (err) { return next(err); }
}

async function getGame(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = gameService.getGameSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: { message: 'Game session not found' } });
    return success(res, { session });
  } catch (err) { return next(err); }
}

async function submitAnswer(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { questionIndex, answer } = req.body;
    const session = gameService.submitAnswer(sessionId, req.user.userId, questionIndex, answer);
    if (!session) return res.status(404).json({ success: false, error: { message: 'Session not found or not active' } });
    return success(res, { session });
  } catch (err) { return next(err); }
}

async function getResult(req, res, next) {
  try {
    const { sessionId } = req.params;
    const result = gameService.computeGameResult(sessionId);
    if (!result) return res.status(404).json({ success: false, error: { message: 'Cannot compute result' } });
    return success(res, { result });
  } catch (err) { return next(err); }
}

module.exports = { createGame, getGame, submitAnswer, getResult };
