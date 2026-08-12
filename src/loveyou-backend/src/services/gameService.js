/**
 * Game Service — 3 mini-games for matched couples
 * 1. Would You Rather (Thích cái nào hơn?)
 * 2. Guess Interests (Đoán sở thích của đối phương)
 * 3. Spin the Bottle (Câu hỏi ngẫu nhiên thú vị)
 */

const WOULD_YOU_RATHER_QUESTIONS = [
  { id: 1, optionA: '☕ Cà phê buổi sáng mỗi ngày', optionB: '🍵 Trà chiều mỗi ngày' },
  { id: 2, optionA: '🎬 Phim hành động kịch tính', optionB: '💕 Phim tình cảm lãng mạn' },
  { id: 3, optionA: '🏖️ Nghỉ dưỡng bãi biển', optionB: '🏔️ Khám phá núi rừng' },
  { id: 4, optionA: '🌅 Thức dậy sớm ngắm bình minh', optionB: '🌙 Thức khuya hưởng đêm khuya' },
  { id: 5, optionA: '🏠 Ở nhà chill xem phim cuối tuần', optionB: '🎭 Ra ngoài vui chơi với bạn bè' },
  { id: 6, optionA: '📚 Đọc sách yêu thích', optionB: '🎵 Nghe nhạc thư giãn' },
  { id: 7, optionA: '🍕 Pizza truyền thống', optionB: '🍣 Sushi Nhật Bản' },
  { id: 8, optionA: '😺 Team mèo', optionB: '🐶 Team chó' },
  { id: 9, optionA: '🌧️ Ngồi ngắm mưa trong nhà', optionB: '☀️ Ra ngoài tận hưởng nắng đẹp' },
  { id: 10, optionA: '🎮 Chơi game video', optionB: '🎲 Chơi board game với bạn' },
  { id: 11, optionA: '✈️ Du lịch nước ngoài xa xôi', optionB: '🗺️ Khám phá vùng quê trong nước' },
  { id: 12, optionA: '🎤 Hát karaoke tự tin', optionB: '💃 Nhảy theo bài nhạc yêu thích' },
];

const SPIN_THE_BOTTLE_QUESTIONS = [
  '🌟 Khoảnh khắc hạnh phúc nhất trong năm nay của bạn là gì?',
  '💭 Điều bí mật thú vị mà ít ai biết về bạn?',
  '🎯 Mục tiêu lớn nhất bạn muốn đạt được trong 1 năm tới?',
  '💖 Bạn định nghĩa "tình yêu lý tưởng" như thế nào?',
  '🎵 Bài hát nào mô tả đúng nhất cuộc đời bạn lúc này?',
  '🌍 Nếu có thể đến bất kỳ đâu trên thế giới ngay lập tức, bạn chọn đâu?',
  '🧠 Bạn học được gì quan trọng nhất từ mối tình trước?',
  '😂 Kỷ niệm hài hước nhất của bạn là gì?',
  '🌙 Điều cuối cùng bạn nghĩ đến trước khi ngủ mỗi đêm?',
  '✨ Nếu có 3 điều ước, bạn sẽ ước điều gì?',
  '🎭 Bạn muốn thử nghề gì ngoài công việc hiện tại?',
  '📱 App hoặc website nào bạn mở nhiều nhất mỗi ngày?',
  '🍽️ Nếu nấu một bữa ăn đặc biệt cho người bạn thích, bạn sẽ nấu gì?',
  '⭐ Điều bạn trân trọng nhất trong một người bạn/người yêu?',
  '🎁 Món quà ý nghĩa nhất bạn từng nhận được?',
];

// In-memory game sessions (production would use Redis)
const gameSessions = new Map();

/**
 * Tạo một game session mới
 */
function createGameSession(gameType, initiatorId, partnerId, matchId) {
  const sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let gameData = {};
  if (gameType === 'WOULD_YOU_RATHER') {
    // Pick 5 random questions
    const shuffled = [...WOULD_YOU_RATHER_QUESTIONS].sort(() => Math.random() - 0.5);
    gameData.questions = shuffled.slice(0, 5);
    gameData.answers = {};
    gameData.currentQuestionIndex = 0;
  } else if (gameType === 'SPIN_THE_BOTTLE') {
    const shuffled = [...SPIN_THE_BOTTLE_QUESTIONS].sort(() => Math.random() - 0.5);
    gameData.questions = shuffled.slice(0, 5);
    gameData.answers = {};
    gameData.currentQuestionIndex = 0;
  } else if (gameType === 'GUESS_INTERESTS') {
    gameData.answers = {};
    gameData.phase = 'WAITING_INTERESTS';
  }

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
      summary: compatibilityPct >= 80
        ? '🔥 Hai bạn cực kỳ hợp nhau!'
        : compatibilityPct >= 60
        ? '💕 Hai bạn khá ăn ý với nhau!'
        : compatibilityPct >= 40
        ? '🌟 Hai bạn có sự khác biệt thú vị!'
        : '🎭 Hai bạn rất khác nhau — điều đó thú vị đấy!',
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
      summary: '✨ Cảm ơn hai bạn đã chia sẻ! Hiểu nhau hơn rồi nhé 💖',
    };
  }

  return null;
}

function getGameSession(sessionId) {
  return gameSessions.get(sessionId) || null;
}

function getRandomSpinQuestion() {
  return SPIN_THE_BOTTLE_QUESTIONS[Math.floor(Math.random() * SPIN_THE_BOTTLE_QUESTIONS.length)];
}

module.exports = {
  createGameSession,
  acceptGameSession,
  submitAnswer,
  computeGameResult,
  getGameSession,
  getRandomSpinQuestion,
  WOULD_YOU_RATHER_QUESTIONS,
  SPIN_THE_BOTTLE_QUESTIONS,
};
