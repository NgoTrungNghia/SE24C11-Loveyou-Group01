/**
 * Game Service — 3 mini-games for matched couples
 * 1. Would You Rather (Thích cái nào hơn?)
 * 2. Guess Interests (Đoán sở thích của đối phương)
 * 3. Spin the Bottle (Câu hỏi ngẫu nhiên thú vị)
 */

// In-memory game sessions (production would use Redis)
const gameSessions = new Map();

/**
 * Tạo một game session mới
 */
function createGameSession(gameType, initiatorId, partnerId, matchId) {
  const sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let gameData = {
    questions: [],
    answers: {},
    currentQuestionIndex: 0,
  };

  const session = {
    sessionId,
    gameType,
    initiatorId: Number(initiatorId),
    partnerId: Number(partnerId),
    matchId: Number(matchId),
    status: 'PENDING', // PENDING | ACTIVE | COMPLETED
    gameData,
    createdAt: new Date(),
    completedAt: null,
  };

  gameSessions.set(sessionId, session);
  return session;
}

/**
 * Chấp nhận game invitation
 */
function acceptGameSession(sessionId) {
  const session = gameSessions.get(sessionId);
  if (!session) return null;
  session.status = 'ACTIVE';
  return session;
}

/**
 * Ghi nhận câu trả lời của user
 */
function submitAnswer(sessionId, userId, questionIndex, answer) {
  const session = gameSessions.get(sessionId);
  if (!session || session.status !== 'ACTIVE') return null;

  const uid = Number(userId);
  if (!session.gameData.answers[questionIndex]) {
    session.gameData.answers[questionIndex] = {};
  }
  session.gameData.answers[questionIndex][uid] = answer;
  return session;
}

/**
 * Kiểm tra và tính kết quả game
 */
function computeGameResult(sessionId) {
  const session = gameSessions.get(sessionId);
  if (!session) return null;

  const { gameType, initiatorId, partnerId, gameData } = session;
  const answers = gameData.answers;
  const questions = gameData.questions || [];

  if (gameType === 'WOULD_YOU_RATHER') {
    let matches = 0;
    let total = 0;
    questions.forEach((q, idx) => {
      const qAnswers = answers[idx] || {};
      const initAns = qAnswers[initiatorId];
      const partAns = qAnswers[partnerId];
      if (initAns !== undefined && partAns !== undefined) {
        total++;
        if (initAns === partAns) matches++;
      }
    });
    const compatibilityPct = total > 0 ? Math.round((matches / total) * 100) : 0;
    session.status = 'COMPLETED';
    session.completedAt = new Date();
    return {
      sessionId,
      gameType,
      compatibilityPct,
      matches,
      total,
      summary: '',
      answers,
      questions,
    };
  }

  if (gameType === 'SPIN_THE_BOTTLE') {
    session.status = 'COMPLETED';
    session.completedAt = new Date();
    return {
      sessionId,
      gameType,
      answers,
      questions,
      summary: '',
    };
  }

  return null;
}

/**
 * Đặt câu hỏi AI vào session (thay thế câu hỏi mặc định)
 */
function setGameQuestions(sessionId, questions) {
  const session = gameSessions.get(sessionId);
  if (!session) return null;
  session.gameData.questions = questions;
  // Reset answers vì câu hỏi mới
  session.gameData.answers = {};
  session.gameData.currentQuestionIndex = 0;
  return session;
}

/**
 * Tạm dừng game session khi 1 người ngắt kết nối
 */
function pauseGameSession(sessionId) {
  const session = gameSessions.get(sessionId);
  if (!session) return;
  session.status = 'PAUSED';
}

/**
 * Lấy tất cả game sessions đang ACTIVE của một user
 */
function getActiveSessionsForUser(userId) {
  const uid = Number(userId);
  const result = [];
  gameSessions.forEach(session => {
    if (
      session.status === 'ACTIVE' &&
      (session.initiatorId === uid || session.partnerId === uid)
    ) {
      result.push(session);
    }
  });
  return result;
}

function getGameSession(sessionId) {
  return gameSessions.get(sessionId) || null;
}

module.exports = {
  createGameSession,
  acceptGameSession,
  setGameQuestions,
  submitAnswer,
  computeGameResult,
  pauseGameSession,
  getActiveSessionsForUser,
  getGameSession,
};
