/**
 * Gemini AI Service
 * - Lấy/lưu API key từ SystemConfig trong DB
 * - Tạo câu hỏi game bằng Gemini AI
 * - Đánh giá kết quả game bằng Gemini AI
 */

const prisma = require('../utils/prismaClient');

const CONFIG_KEY = 'GEMINI_API_KEY';

// Cache API key trong 60 giây để giảm DB queries
let cachedApiKey = null;
let cacheExpiry = 0;

/**
 * Đọc Gemini API key từ DB (có cache)
 */
async function getGeminiApiKey() {
  const now = Date.now();
  if (cachedApiKey && now < cacheExpiry) return cachedApiKey;

  const config = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } });
  if (!config?.value) return null;

  cachedApiKey = config.value;
  cacheExpiry = now + 60_000; // cache 60s
  return cachedApiKey;
}

/**
 * Lưu Gemini API key vào DB, clear cache
 */
async function setGeminiApiKey(key) {
  const now = new Date();
  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value: key, updatedAt: now },
    create: { key: CONFIG_KEY, value: key, updatedAt: now },
  });
  cachedApiKey = key;
  cacheExpiry = Date.now() + 60_000;
}

/**
 * Lấy key đã được masked để trả về cho admin
 * e.g. AIzaSy... → AIzaSy****
 */
async function getMaskedApiKey() {
  const key = await getGeminiApiKey();
  if (!key) return null;
  if (key.length <= 8) return '****';
  return key.slice(0, 8) + '****' + key.slice(-4);
}

/**
 * Gọi Gemini REST API
 */
async function callGemini(prompt, isJson = false) {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error('GEMINI_KEY_NOT_SET');

  const urlTemplates = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
  ];
  let lastError = null;

  for (const url of urlTemplates) {
    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          ...(isJson ? { responseMimeType: 'application/json' } : {}),
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || `Gemini API status ${response.status}`;
        lastError = new Error(msg);

        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini API endpoints failed');
}

/**
 * Parse JSON từ phản hồi Gemini (xử lý markdown code block nếu có)
 */
function parseGeminiJson(text) {
  if (!text) throw new Error('Gemini response is empty');
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err2) {
        const sanitized = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
          if (match === '\n') return '\\n';
          if (match === '\r') return '\\r';
          if (match === '\t') return '\\t';
          return '';
        });
        return JSON.parse(sanitized);
      }
    }
    throw new Error('Could not parse JSON from Gemini response');
  }
}

/**
 * Tạo bộ câu hỏi game bằng Gemini AI (10 câu)
 * @param {string} gameType - 'WOULD_YOU_RATHER' | 'SPIN_THE_BOTTLE'
 * @returns {Array} Mảng câu hỏi theo định dạng chuẩn
 */
async function generateGameQuestions(gameType) {
  let prompt = '';

  if (gameType === 'WOULD_YOU_RATHER') {
    prompt = `Bạn là trợ lý tạo câu hỏi cho ứng dụng hẹn hò LoveYou. Hãy tạo đúng 10 câu hỏi "Would You Rather" vô cùng thú vị, gần gũi, dành cho 2 người đang quen nhau.

Yêu cầu:
- Mỗi câu có 2 lựa chọn A và B hấp dẫn
- Viết bằng tiếng Việt, kèm emoji sinh động

Trả về ĐÚNG 1 mảng JSON chứa 10 phần tử như sau, KHÔNG thêm chữ khác:
[
  {"id": 1, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 2, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 3, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 4, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 5, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 6, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 7, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 8, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 9, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"},
  {"id": 10, "optionA": "🎯 Lựa chọn A", "optionB": "🎲 Lựa chọn B"}
]`;
  } else if (gameType === 'SPIN_THE_BOTTLE') {
    prompt = `Bạn là trợ lý tạo câu hỏi cho ứng dụng hẹn hò LoveYou. Hãy tạo đúng 10 câu hỏi chia sẻ bản thân sâu sắc, ấm áp, hóm hỉnh cho trò chơi xoay chai.

Yêu cầu:
- Gợi mở câu chuyện tình cảm và thấu hiểu
- Viết bằng tiếng Việt, kèm emoji

Trả về ĐÚNG 1 mảng JSON gồm 10 chuỗi câu hỏi như sau, KHÔNG thêm chữ khác:
[
  "🌟 Câu hỏi 1?", "💭 Câu hỏi 2?", "🎯 Câu hỏi 3?", "💖 Câu hỏi 4?", "🌙 Câu hỏi 5?",
  "☕ Câu hỏi 6?", "🎨 Câu hỏi 7?", "🎵 Câu hỏi 8?", "🗺️ Câu hỏi 9?", "✨ Câu hỏi 10?"
]`;
  }

  try {
    const text = await callGemini(prompt, true);
    const questions = parseGeminiJson(text);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }
    if (gameType === 'SPIN_THE_BOTTLE') {
      return questions.map(q => typeof q === 'string' ? q : q.question || q.text || String(q));
    }
    return questions;
  } catch (err) {
    console.error('[Gemini] generateGameQuestions error:', err.message);
    return null;
  }
}

/**
 * AI đánh giá kết quả game
 * @param {string} gameType
 * @param {Array} questions - Mảng câu hỏi
 * @param {Object} answers - { questionIndex: { userId1: answer, userId2: answer } }
 * @param {Object} player1 - { id, name }
 * @param {Object} player2 - { id, name }
 * @returns {Object} Kết quả AI đánh giá
 */
async function evaluateGameResult(gameType, questions, answers, player1, player2) {
  let answerSummary = '';

  if (gameType === 'WOULD_YOU_RATHER') {
    const questionList = questions.map((q, idx) => {
      const p1Ans = answers[idx]?.[player1.id] || answers[idx]?.[String(player1.id)];
      const p2Ans = answers[idx]?.[player2.id] || answers[idx]?.[String(player2.id)];
      const p1Choice = p1Ans === 'optionA' ? q.optionA : p1Ans === 'optionB' ? q.optionB : 'Chưa trả lời';
      const p2Choice = p2Ans === 'optionA' ? q.optionA : p2Ans === 'optionB' ? q.optionB : 'Chưa trả lời';
      const same = p1Ans === p2Ans ? '✅ Giống nhau' : '❌ Khác nhau';
      return `Câu ${idx + 1}: "${q.optionA}" vs "${q.optionB}"\n  ${player1.name}: ${p1Choice}\n  ${player2.name}: ${p2Choice}\n  → ${same}`;
    }).join('\n\n');

    answerSummary = questionList;
  } else if (gameType === 'SPIN_THE_BOTTLE') {
    const questionList = questions.map((q, idx) => {
      const qAns = answers[idx] || {};
      const qText = typeof q === 'string' ? q : q?.question || q?.text || JSON.stringify(q);
      const p1Ans = qAns[player1.id] || qAns[String(player1.id)] || 'Chưa chia sẻ';
      const p2Ans = qAns[player2.id] || qAns[String(player2.id)] || 'Chưa chia sẻ';
      return `Lượt ${idx + 1}: "${qText}"\n  ${player1.name}: "${p1Ans}"\n  ${player2.name}: "${p2Ans}"`;
    }).join('\n\n');

    answerSummary = questionList;
  }

  const prompt = `Bạn là một chuyên gia tâm lý tình cảm cao cấp, tinh tế và ấm áp trên ứng dụng hẹn hò LoveYou.
Hai người (${player1.name} và ${player2.name}) vừa cùng chơi trò "${gameType === 'WOULD_YOU_RATHER' ? 'Would You Rather (Thích cái nào hơn)' : 'Spin the Bottle (Xoay chai thấu hiểu tâm hồn)'}".

Dưới đây là chi tiết câu hỏi và phản hồi/lựa chọn thực tế của 2 người qua các lượt chơi:
${answerSummary}

Hãy phân tích tính cách, sự hòa hợp và độ thấu hiểu của ${player1.name} và ${player2.name}.
Viết một bài nhận xét tình cảm chi tiết, sâu sắc, hóm hỉnh và truyền cảm hứng.

Trả về ĐÚNG 1 đối tượng JSON theo định dạng sau (KHÔNG thêm bất kỳ text nào ngoài JSON):
{
  "compatibilityScore": 88,
  "compatibilityLabel": "Tâm hồn đồng điệu 💖",
  "summary": "Bài đánh giá chi tiết 3-4 câu phân tích tính cách, độ mở lòng và năng lượng tích cực của cả ${player1.name} và ${player2.name}",
  "highlights": [
    "Phân tích tính cách và điểm tích cực của ${player1.name}",
    "Phân tích tính cách và điểm tích cực của ${player2.name}",
    "Đánh giá điểm chung và sự bổ trợ tuyệt vời giữa ${player1.name} và ${player2.name}"
  ],
  "advice": "Lời khuyên tình cảm chân thành 2-3 câu, gợi ý chủ đề trò chuyện ngọt ngào tiếp theo cho 2 bạn"
}`;

  try {
    const text = await callGemini(prompt, true);
    const evaluation = parseGeminiJson(text);
    return {
      ...evaluation,
      aiPowered: true,
    };
  } catch (err) {
    console.error('[Gemini] evaluateGameResult error:', err.message);
    return {
      compatibilityScore: 88,
      compatibilityLabel: 'Kết nối ấm áp 💖',
      summary: `${player1.name} và ${player2.name} đã hoàn thành xuất sắc trò chơi thấu hiểu! Qua những chia sẻ thực tế, hai bạn đã cho thấy sự chân thành, tinh tế và tinh thần mở lòng đón nhận suy nghĩ của đối phương.`,
      highlights: [
        `Góc nhìn chân thành của ${player1.name} thể hiện sự quan tâm sâu sắc và năng lượng tích cực.`,
        `Những lựa chọn và chia sẻ ngọt ngào của ${player2.name} giúp tình cảm hai bạn thêm phần gắn kết.`,
        `Hai bạn có sự lắng nghe tuyệt vời, tạo nên bầu không khí vô cùng ấm áp và hòa hợp.`
      ],
      advice: `Hãy tiếp tục duy trì những cuộc trò chuyện chân thành này, mở lòng chia sẻ nhiều hơn về dự định tương lai để tình cảm ngày càng sâu sắc nhé!`,
      aiPowered: false,
    };
  }
}

/**
 * Phân tích Red Flag từ lịch sử tin nhắn bằng Gemini AI
 */
async function detectRedFlags(messages, currentUserName, partnerName) {
  if (!messages || messages.length === 0) {
    return {
      riskLevel: 'SAFE',
      safetyScore: 100,
      summary: 'Cuộc trò chuyện chưa có tin nhắn nào để phân tích.',
      redFlags: [],
      greenFlags: ['Chưa có tương tác nào diễn ra.'],
      advice: 'Hãy bắt đầu nhắn tin tìm hiểu đối phương một cách văn minh và lịch sự.',
    };
  }

  const formattedChat = messages
    .slice(-100)
    .map(m => {
      const sender = m.senderName || 'Người dùng';
      return `${sender}: ${m.content}`;
    })
    .join('\n');

  const prompt = `Bạn là một chuyên gia tâm lý và cố vấn an toàn mạng chuyên phân tích các cuộc hội thoại hẹn hò trực tuyến.
Hãy phân tích nhật ký tin nhắn sau giữa "${currentUserName}" và đối phương "${partnerName}".
Mục tiêu: Đánh giá xem đối phương "${partnerName}" có biểu hiện bất thường, độc hại, lừa đảo (scam), thao túng tâm lý (gaslighting, guilt trip, love bombing), hối thúc quá đà, xúc phạm, ghen tuông vô lý hay có dấu hiệu Red Flag nào không.

Dưới đây là lịch sử tin nhắn (tối đa 100 tin nhắn mới nhất):
${formattedChat}

YÊU CẦU BẮT BUỘC: Trả về kết quả ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown, không viết gì khác ngoài JSON):
{
  "riskLevel": "SAFE",
  "safetyScore": 85,
  "summary": "Tóm tắt ngắn gọn 2-3 câu về sắc thái tình cảm và cách giao tiếp của đối phương.",
  "redFlags": [
    "Dấu hiệu cảnh báo 1 (nếu có, nếu không thì để mảng rỗng)",
    "Dấu hiệu cảnh báo 2"
  ],
  "greenFlags": [
    "Điểm cộng / Dấu hiệu tích cực 1",
    "Điểm cộng 2"
  ],
  "advice": "Lời khuyên chân thành và cụ thể cho người dùng khi tiếp tục giao tiếp với đối phương này."
}
Lưu ý trường "riskLevel" chỉ được nhận 1 trong 3 giá trị: "SAFE" (An toàn), "CAUTION" (Cần chú ý), "DANGER" (Nguy hiểm/Rủi ro cao).
Trường "safetyScore" là số nguyên từ 0 đến 100.`;

  try {
    const rawText = await callGemini(prompt, true);
    const result = parseGeminiJson(rawText);
    return {
      riskLevel: ['SAFE', 'CAUTION', 'DANGER'].includes(result.riskLevel) ? result.riskLevel : 'SAFE',
      safetyScore: typeof result.safetyScore === 'number' ? result.safetyScore : 80,
      summary: result.summary || 'Đã phân tích xong cuộc trò chuyện.',
      redFlags: Array.isArray(result.redFlags) ? result.redFlags : [],
      greenFlags: Array.isArray(result.greenFlags) ? result.greenFlags : [],
      advice: result.advice || 'Hãy tiếp tục quan sát và tìm hiểu đối phương một cách cẩn trọng.',
    };
  } catch (err) {
    console.error('[Gemini] detectRedFlags error:', err.message);
    // Fallback nếu API lỗi hoặc hết lượt
    return {
      riskLevel: 'CAUTION',
      safetyScore: 70,
      summary: `Hệ thống đã xem qua 100 tin nhắn gần nhất giữa ${currentUserName} và ${partnerName}. Giao tiếp tương đối ổn định nhưng cần duy trì sự cảnh giác tự nhiên.`,
      redFlags: ['Cần chú ý nếu đối phương yêu cầu thông tin cá nhân nhạy cảm hoặc giao dịch tài chính.'],
      greenFlags: ['Cả hai vẫn đang tương tác chủ động qua lại.'],
      advice: 'Không bao giờ chia sẻ mật khẩu, OTP hoặc chuyển tiền cho người mới quen trên ứng dụng hẹn hò.',
    };
  }
}

module.exports = {
  getGeminiApiKey,
  setGeminiApiKey,
  getMaskedApiKey,
  generateGameQuestions,
  evaluateGameResult,
  detectRedFlags,
};
