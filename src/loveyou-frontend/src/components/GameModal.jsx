import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../utils/socket';

const GAME_TYPES = [
  {
    id: 'WOULD_YOU_RATHER',
    emoji: '🤔',
    name: 'Thích cái nào hơn?',
    desc: 'Cùng trả lời câu hỏi "Would You Rather" và so sánh sự ăn ý',
  },
  {
    id: 'SPIN_THE_BOTTLE',
    emoji: '🍾',
    name: 'Spin the Bottle',
    desc: 'Vòng quay câu hỏi thú vị — khám phá nhau nhiều hơn',
  },
];

function getRoundTarget(sessionId, qIdx, initiatorId, partnerId) {
  if (!sessionId) return initiatorId;
  let charSum = 0;
  for (let i = 0; i < sessionId.length; i++) charSum += sessionId.charCodeAt(i);
  const targetIsInitiator = (charSum + qIdx * 13) % 2 === 0;
  return targetIsInitiator ? initiatorId : partnerId;
}

// Phase: SELECT | WAITING | LOADING_QUESTIONS | PLAYING | RESULT | PAUSED
export default function GameModal({ match, currentUserId, initialSession, onClose }) {
  const [phase, setPhase] = useState(initialSession ? 'LOADING_QUESTIONS' : 'SELECT');
  const [selectedGame, setSelectedGame] = useState(null);
  const [session, setSession] = useState(initialSession || null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [myAnswer, setMyAnswer] = useState(null);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [waitCount, setWaitCount] = useState(0);
  const [revealAnswers, setRevealAnswers] = useState(false);
  const [pausedReason, setPausedReason] = useState('');

  // Spin the Bottle states
  const [bottleRotation, setBottleRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpunRound, setHasSpunRound] = useState(false);
  const [textInput, setTextInput] = useState('');

  const socket = getSocket();
  const waitIntervalRef = useRef(null);
  const hasEmittedFinishRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    // game_started: cả 2 bên chuyển sang LOADING_QUESTIONS (đợi AI sinh câu hỏi)
    const handleGameStarted = ({ session: s }) => {
      setSession(s);
      setPhase('LOADING_QUESTIONS');
      setCurrentQIdx(0);
      setMyAnswer(null);
      setPartnerAnswered(false);
      hasEmittedFinishRef.current = false;
    };

    // game_questions_ready: AI đã sinh xong câu hỏi → bắt đầu PLAYING
    const handleQuestionsReady = ({ session: s }) => {
      setSession(s);
      setPhase('PLAYING');
      setCurrentQIdx(0);
      setMyAnswer(null);
      setPartnerAnswered(false);
      setHasSpunRound(false);
      setBottleRotation(0);
      hasEmittedFinishRef.current = false;
    };

    const handleAnswerReceived = ({ userId }) => {
      if (Number(userId) !== currentUserId) {
        setPartnerAnswered(true);
      }
    };

    const handleBothAnswered = ({ questionIndex, answers: qAnswers }) => {
      if (qAnswers) {
        setSession(prev => {
          if (!prev) return prev;
          const updatedAnswers = { ...prev.gameData?.answers, [questionIndex]: qAnswers };
          return {
            ...prev,
            gameData: { ...prev.gameData, answers: updatedAnswers },
          };
        });
      }
      setRevealAnswers(true);
      setTimeout(() => {
        setRevealAnswers(false);
        setMyAnswer(null);
        setPartnerAnswered(false);
        setHasSpunRound(false);
        setSession(currentSession => {
          const qList = currentSession?.gameData?.questions || [];
          const answeredIndex = questionIndex !== undefined ? questionIndex : 0;
          const nextIndex = answeredIndex + 1;
          if (nextIndex >= qList.length) {
            setPhase('EVALUATING_AI');
            if (socket && currentSession?.sessionId && !hasEmittedFinishRef.current) {
              hasEmittedFinishRef.current = true;
              socket.emit('game_finish', { sessionId: currentSession.sessionId });
            }
          } else {
            setCurrentQIdx(nextIndex);
          }
          return currentSession;
        });
      }, 2500);
    };

    const handleGameResult = ({ result: r }) => {
      setResult(prev => {
        // Luôn giữ kết quả AI phân tích chi tiết đầy đủ chính thức
        if (prev?.summary && prev?.aiPowered && !r?.aiPowered) {
          return prev;
        }
        return r;
      });
      setPhase('RESULT');
    };

    // game_paused: đối phương thoát giữa chừng
    const handleGamePaused = ({ reason }) => {
      setPausedReason(reason || 'Đối phương đã rời khỏi trò chơi');
      setPhase('PAUSED');
    };

    socket.on('game_started', handleGameStarted);
    socket.on('game_questions_ready', handleQuestionsReady);
    socket.on('game_answer_received', handleAnswerReceived);
    socket.on('game_both_answered', handleBothAnswered);
    socket.on('game_result', handleGameResult);
    socket.on('game_paused', handleGamePaused);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('game_questions_ready', handleQuestionsReady);
      socket.off('game_answer_received', handleAnswerReceived);
      socket.off('game_both_answered', handleBothAnswered);
      socket.off('game_result', handleGameResult);
      socket.off('game_paused', handleGamePaused);
    };
  }, [socket, currentUserId]);

  // Waiting timer animation
  useEffect(() => {
    if (phase === 'WAITING' || phase === 'LOADING_QUESTIONS' || phase === 'EVALUATING_AI') {
      waitIntervalRef.current = setInterval(() => setWaitCount(p => (p + 1) % 4), 600);
    }
    return () => clearInterval(waitIntervalRef.current);
  }, [phase]);

  function inviteGame(gameType) {
    if (!socket || !match) return;
    setSelectedGame(gameType);
    socket.emit('game_invite', {
      partnerId: match.partner?.id || match.id,
      gameType: gameType.id,
      matchId: match.matchId,
    });
    setPhase('WAITING');
  }

  function submitAnswer(answer) {
    if (!socket || !session || myAnswer !== null) return;
    setMyAnswer(answer);
    socket.emit('game_answer', {
      sessionId: session.sessionId,
      questionIndex: currentQIdx,
      answer,
    });
  }

  const lastSpunIndexRef = useRef(-1);

  // Auto-spin bottle on each round start when question view is active
  useEffect(() => {
    if (phase === 'PLAYING' && !revealAnswers && session?.gameType === 'SPIN_THE_BOTTLE') {
      if (lastSpunIndexRef.current !== currentQIdx) {
        lastSpunIndexRef.current = currentQIdx;
        setIsSpinning(true);
        setHasSpunRound(false);

        const targetUserId = getRoundTarget(session?.sessionId, currentQIdx, session?.initiatorId, session?.partnerId);
        const isMe = Number(targetUserId) === Number(currentUserId);
        // If I am chosen (isMe = true): head of bottle points UP at 0deg (👤 Bạn).
        // If partner is chosen (isMe = false): head points DOWN at 180deg (💖 Partner), base/đít chai points UP at 0deg (👤 Bạn).
        const targetDeg = isMe ? 0 : 180;
        const targetRotation = (currentQIdx + 1) * 1440 + targetDeg;

        // 60ms frame delay guarantees browser paints current rotation first before triggering 2.2s CSS spin!
        const spinStartTimer = setTimeout(() => {
          setBottleRotation(targetRotation);
        }, 60);

        const spinFinishTimer = setTimeout(() => {
          setIsSpinning(false);
          setHasSpunRound(true);
        }, 2350);

        return () => {
          clearTimeout(spinStartTimer);
          clearTimeout(spinFinishTimer);
        };
      }
    }
  }, [phase, revealAnswers, currentQIdx, session?.gameType, session?.sessionId]);

  function finishGame() {
    if (!socket || !session) return;
    socket.emit('game_finish', { sessionId: session.sessionId });
  }

  function handleCloseModal() {
    if (socket && session?.sessionId && phase !== 'RESULT' && phase !== 'PAUSED') {
      socket.emit('game_leave', { sessionId: session.sessionId });
    }
    onClose();
  }

  const questions = session?.gameData?.questions || [];
  const currentQ = questions[currentQIdx];
  const isLastQuestion = currentQIdx >= questions.length - 1;
  const dotCount = ''.padStart(waitCount + 1, '•');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: '460px', maxHeight: '90vh',
        background: 'linear-gradient(145deg, #1a1e2e, #12151a)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(253,38,125,0.1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fd267d, #ff6036)',
          padding: '1.2rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎮 Mini Game
            {(phase === 'PLAYING' || phase === 'LOADING_QUESTIONS') && (
              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                🤖 AI
              </span>
            )}
          </div>
          <button
            onClick={handleCloseModal}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
              borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '1.2rem 1.4rem', flex: 1, overflowY: 'auto' }}>

          {/* PHASE: SELECT GAME */}
          {phase === 'SELECT' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.3rem' }}>
                  Chọn mini-game
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  Cùng chơi với {match?.partner?.name || 'đối phương'}
                </div>
                <div style={{ color: 'rgba(253,38,125,0.8)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  🤖 Câu hỏi được tạo bởi Gemini AI
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {GAME_TYPES.map(game => (
                  <button
                    key={game.id}
                    onClick={() => inviteGame(game)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '1rem 1.2rem',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(253,38,125,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(253,38,125,0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '14px',
                      background: 'rgba(253,38,125,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.8rem', flexShrink: 0,
                    }}>
                      {game.emoji}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{game.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{game.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PHASE: WAITING for partner */}
          {phase === 'WAITING' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{selectedGame?.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
                {selectedGame?.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Đã gửi lời mời đến {match?.partner?.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1rem' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: i <= waitCount ? '#fd267d' : 'rgba(255,255,255,0.2)',
                    transition: 'background 0.3s ease',
                  }} />
                ))}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                Đang chờ đối phương chấp nhận...
              </div>
            </div>
          )}

          {/* PHASE: LOADING_QUESTIONS — AI đang tạo câu hỏi */}
          {phase === 'LOADING_QUESTIONS' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
              <div style={{
                fontSize: '3rem', marginBottom: '1rem',
                animation: 'spin 2s linear infinite',
                display: 'inline-block',
              }}>🤖</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
                AI đang tạo câu hỏi{dotCount}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                Gemini AI đang chuẩn bị bộ câu hỏi
                <br />
                độc đáo và thú vị dành riêng cho hai bạn 💫
              </div>
              <div style={{
                marginTop: '1.5rem',
                height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: '40%',
                  background: 'linear-gradient(90deg, transparent, #fd267d, transparent)',
                  animation: 'loading-slide 1.5s ease-in-out infinite',
                }} />
              </div>
            </div>
          )}

          {/* PHASE: EVALUATING_AI — AI đang phân tích & nhận xét */}
          {phase === 'EVALUATING_AI' && (() => {
            const evalMessages = [
              '🤖 Gemini AI đang đọc và phân tích từng câu trả lời...',
              '💖 Đang phân tích góc nhìn & độ thấu hiểu của hai bạn...',
              '✨ Đang chấm điểm ăn ý và soạn nhận xét chân thành riêng cho 2 bạn...',
              '💌 Chuẩn bị kết quả phân tích tâm hồn...',
            ];
            return (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fd267d, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem auto', fontSize: '2.8rem',
                  boxShadow: '0 0 40px rgba(253,38,125,0.5)',
                  animation: 'pulse 1.5s infinite alternate',
                }}>
                  🤖
                </div>

                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff', marginBottom: '0.6rem' }}>
                  Gemini AI đang phân tích kết quả{dotCount}
                </div>

                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto 1.8rem auto', minHeight: '44px' }}>
                  {evalMessages[waitCount % evalMessages.length]}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: i === waitCount % 4 ? '#fd267d' : 'rgba(255,255,255,0.2)',
                      transform: i === waitCount % 4 ? 'scale(1.3)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                    }} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* PHASE: PLAYING */}
          {phase === 'PLAYING' && currentQ && !revealAnswers && (
            <div>
              {/* Progress */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '1.2rem' }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: '4px', borderRadius: '2px',
                    background: i < currentQIdx ? '#fd267d' : i === currentQIdx ? 'linear-gradient(90deg, #fd267d, #ff6036)' : 'rgba(255,255,255,0.15)',
                  }} />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  {session?.gameType === 'SPIN_THE_BOTTLE' ? `Lượt xoay ${Math.min(currentQIdx + 1, questions.length || 10)} / ${questions.length || 10}` : `Câu ${Math.min(currentQIdx + 1, questions.length || 10)} / ${questions.length || 10}`}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', lineHeight: '1.5' }}>
                  {session?.gameType === 'WOULD_YOU_RATHER' ? '🤔 Bạn thích cái nào hơn?' : '🍾 Lượt xoay chia sẻ câu hỏi'}
                </div>
              </div>

              {/* WOULD YOU RATHER options */}
              {session?.gameType === 'WOULD_YOU_RATHER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {['optionA', 'optionB'].map((opt, idx) => (
                    <button
                      key={opt}
                      onClick={() => submitAnswer(opt)}
                      disabled={myAnswer !== null}
                      style={{
                        background: myAnswer === opt
                          ? 'linear-gradient(135deg, #fd267d, #ff6036)'
                          : myAnswer !== null
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.08)',
                        border: myAnswer === opt ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '14px',
                        padding: '1rem 1.2rem',
                        cursor: myAnswer !== null ? 'not-allowed' : 'pointer',
                        color: myAnswer !== null && myAnswer !== opt ? 'rgba(255,255,255,0.4)' : '#fff',
                        fontWeight: 600, fontSize: '0.9rem', textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: myAnswer === opt ? '0 6px 20px rgba(253,38,125,0.4)' : 'none',
                      }}
                    >
                      <span style={{ opacity: 0.85, marginRight: '0.6rem', fontWeight: 800, color: myAnswer === opt ? '#fff' : '#fd267d' }}>{idx === 0 ? 'A.' : 'B.'}</span>
                      {currentQ[opt]}
                    </button>
                  ))}
                </div>
              )}

              {/* SPIN THE BOTTLE interactive arena */}
              {session?.gameType === 'SPIN_THE_BOTTLE' && (() => {
                const targetUserId = getRoundTarget(session?.sessionId, currentQIdx, session?.initiatorId, session?.partnerId);
                const isMyTurn = Number(targetUserId) === Number(currentUserId);

                return (
                  <div style={{ textAlign: 'center' }}>
                    {/* Bottle Arena */}
                    <div style={{
                      position: 'relative', width: '210px', height: '210px', margin: '0 auto 1.2rem auto',
                      borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                      border: '2px dashed rgba(253,38,125,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isSpinning ? '0 0 40px rgba(253,38,125,0.6)' : '0 0 25px rgba(253,38,125,0.15)',
                      transition: 'box-shadow 0.3s ease',
                    }}>
                      {/* Top Player (Bạn) */}
                      <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 800,
                          padding: '2px 10px', borderRadius: '10px',
                          background: hasSpunRound && isMyTurn ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)',
                          color: hasSpunRound && isMyTurn ? '#34d399' : 'rgba(255,255,255,0.6)',
                          border: hasSpunRound && isMyTurn ? '1px solid rgba(52,211,153,0.5)' : 'none',
                        }}>
                          👤 Bạn {hasSpunRound && isMyTurn && '🎯'}
                        </span>
                      </div>

                      {/* Bottom Player (Partner) */}
                      <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 800,
                          padding: '2px 10px', borderRadius: '10px',
                          background: hasSpunRound && !isMyTurn ? 'rgba(253,38,125,0.3)' : 'rgba(255,255,255,0.1)',
                          color: hasSpunRound && !isMyTurn ? '#fd267d' : 'rgba(255,255,255,0.6)',
                          border: hasSpunRound && !isMyTurn ? '1px solid rgba(253,38,125,0.5)' : 'none',
                        }}>
                          💖 {match?.partner?.name || 'Đối phương'} {hasSpunRound && !isMyTurn && '🎯'}
                        </span>
                      </div>

                      {/* Bottle Icon with dynamic physics rotation */}
                      <div style={{
                        fontSize: '4.5rem',
                        transform: `rotate(${bottleRotation}deg)`,
                        transition: 'transform 2.2s cubic-bezier(0.15, 0.85, 0.35, 1.2)',
                        filter: isSpinning ? 'drop-shadow(0 0 20px #fd267d)' : 'drop-shadow(0 0 10px rgba(253,38,125,0.3))',
                      }}>
                        🍾
                      </div>
                    </div>

                    {/* Step 1: Auto-spinning status card */}
                    {!hasSpunRound ? (
                      <div style={{
                        padding: '1rem', background: 'rgba(253,38,125,0.12)',
                        borderRadius: '14px', border: '1px solid rgba(253,38,125,0.3)',
                        color: '#fd267d', fontWeight: 700, fontSize: '0.92rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      }}>
                        💫 Chai đang tự động xoay ngẫu nhiên...
                      </div>
                    ) : (
                      /* Step 2: Target revealed -> Question & Answer Input */
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {/* Question Banner */}
                        <div style={{
                          background: 'rgba(255,255,255,0.06)', borderRadius: '14px',
                          padding: '1rem 1.2rem', color: '#fff', fontSize: '0.95rem',
                          lineHeight: '1.6', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          <div style={{ fontSize: '0.8rem', color: isMyTurn ? '#34d399' : '#fd267d', fontWeight: 800, marginBottom: '0.4rem' }}>
                            {isMyTurn ? '🎯 Chai ngẫu nhiên chỉ vào BẠN!' : `💖 Chai ngẫu nhiên chỉ vào ${match?.partner?.name || 'đối phương'}!`}
                          </div>
                          {typeof currentQ === 'object' ? (currentQ?.question || currentQ?.text || JSON.stringify(currentQ)) : currentQ}
                        </div>

                        {/* Target Player (My Turn) text input */}
                        {isMyTurn ? (
                          myAnswer === null ? (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                              <textarea
                                rows={2}
                                placeholder="Nhập câu trả lời / chia sẻ chân thật của bạn..."
                                value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                style={{
                                  width: '100%', padding: '0.8rem', borderRadius: '12px',
                                  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)',
                                  color: '#fff', fontSize: '0.9rem', outline: 'none', resize: 'none',
                                  boxSizing: 'border-box', marginBottom: '0.8rem', fontFamily: 'inherit',
                                }}
                              />
                              <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <button
                                  onClick={() => {
                                    const ans = textInput.trim() || 'Đã chia sẻ';
                                    submitAnswer(ans);
                                    setTextInput('');
                                  }}
                                  style={{
                                    flex: 1, padding: '0.8rem', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                                    border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
                                  }}
                                >
                                  💬 Gửi chia sẻ
                                </button>
                                <button
                                  onClick={() => {
                                    submitAnswer('Bỏ qua');
                                    setTextInput('');
                                  }}
                                  style={{
                                    padding: '0.8rem 1.2rem', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                                  }}
                                >
                                  ⏩ Bỏ qua
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: '0.85rem', background: myAnswer === 'Bỏ qua' ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.15)', borderRadius: '12px', color: myAnswer === 'Bỏ qua' ? 'rgba(255,255,255,0.7)' : '#34d399', fontSize: '0.88rem', fontWeight: 600, border: myAnswer === 'Bỏ qua' ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(16,185,129,0.3)' }}>
                              {myAnswer === 'Bỏ qua' ? '⏩ Bạn đã chọn bỏ qua lượt chia sẻ này' : `✓ Bạn đã gửi chia sẻ: "${myAnswer}"`}
                            </div>
                          )
                        ) : (
                          /* Non-Target Player (Waiting for Partner) */
                          <div style={{ padding: '1rem', background: 'rgba(253,38,125,0.1)', borderRadius: '14px', border: '1px solid rgba(253,38,125,0.2)', color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>
                            {partnerAnswered ? (
                              <span style={{ color: '#34d399', fontWeight: 600 }}>✓ {match?.partner?.name || 'Đối phương'} đã hoàn thành lượt trả lời!</span>
                            ) : (
                              <span>⏳ Chai đã dừng ở <strong style={{ color: '#fd267d' }}>{match?.partner?.name || 'đối phương'}</strong>! Đang chờ đối phương trả lời...</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Status indicators */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: '1.2rem',
                padding: '0.8rem', background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ color: myAnswer ? '#34D399' : 'rgba(255,255,255,0.4)' }}>
                    {myAnswer ? '✓' : '○'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Bạn</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{match?.partner?.name}</span>
                  <span style={{ color: partnerAnswered ? '#34D399' : 'rgba(255,255,255,0.4)' }}>
                    {partnerAnswered ? '✓' : '○'}
                  </span>
                </div>
              </div>

              {/* Finish early button */}
              {isLastQuestion && myAnswer && partnerAnswered && (
                <button
                  onClick={finishGame}
                  style={{
                    width: '100%', marginTop: '1rem', padding: '0.9rem',
                    background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                    border: 'none', borderRadius: '14px', color: '#fff',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
                  }}
                >
                  🏁 Xem kết quả
                </button>
              )}
            </div>
          )}

          {/* REVEAL ANSWERS (between questions) */}
          {phase === 'PLAYING' && revealAnswers && (
            (() => {
              const qAnswers = session?.gameData?.answers?.[currentQIdx] || {};

              if (session?.gameType === 'SPIN_THE_BOTTLE') {
                const targetUserId = getRoundTarget(session?.sessionId, currentQIdx, session?.initiatorId, session?.partnerId);
                const isTargetMe = Number(targetUserId) === Number(currentUserId);
                const targetName = isTargetMe ? 'Bạn' : (match?.partner?.name || 'Đối phương');
                const rawAns = qAnswers[targetUserId] || qAnswers[String(targetUserId)] || (isTargetMe ? myAnswer : '');
                const isSkipped = !rawAns || rawAns === 'Bỏ qua';

                return (
                  <div style={{ textAlign: 'center', padding: '1rem 0', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>
                      {isSkipped ? '⏩' : '💬'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: '0.5rem' }}>
                      {isSkipped ? `${targetName} đã chọn bỏ qua câu hỏi này!` : `${targetName} đã chia sẻ:`}
                    </div>
                    {!isSkipped && (
                      <div style={{
                        background: 'rgba(253,38,125,0.12)', border: '1px solid rgba(253,38,125,0.3)',
                        borderRadius: '14px', padding: '0.9rem 1.2rem', color: '#fff', fontSize: '0.95rem',
                        fontStyle: 'italic', marginBottom: '0.8rem', lineHeight: '1.5',
                      }}>
                        "{rawAns}"
                      </div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      {currentQIdx >= questions.length - 1 ? 'Đang tổng hợp kết quả phân tích AI...' : 'Lượt xoay tiếp theo đang đến...'}
                    </div>
                  </div>
                );
              }

              const p1Id = Number(currentUserId);
              const p2Id = Number(match?.partner?.id || match?.id || (session?.initiatorId === p1Id ? session?.partnerId : session?.initiatorId));
              
              const ans1 = qAnswers[p1Id] !== undefined ? qAnswers[p1Id] : qAnswers[String(p1Id)] !== undefined ? qAnswers[String(p1Id)] : myAnswer;
              const ans2 = qAnswers[p2Id] !== undefined ? qAnswers[p2Id] : qAnswers[String(p2Id)];

              const isSame = (ans1 !== undefined && ans2 !== undefined && ans1 === ans2);

              return (
                <div style={{ textAlign: 'center', padding: '0.8rem 0', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ fontSize: '2.4rem', marginBottom: '0.6rem' }}>
                    {isSame ? '🎉' : '🔀'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginBottom: '0.6rem' }}>
                    {isSame ? 'Hai bạn có cùng sự lựa chọn!' : 'Hai bạn có góc nhìn khác nhau!'}
                  </div>

                  <div style={{
                    display: 'flex', gap: '0.7rem', marginTop: '0.5rem', marginBottom: '0.9rem', textAlign: 'left',
                  }}>
                    <div style={{
                      flex: 1, padding: '0.7rem 0.9rem', borderRadius: '12px',
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                      fontSize: '0.82rem',
                    }}>
                      <div style={{ color: '#34D399', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px' }}>👤 Bạn chọn:</div>
                      <div style={{ color: '#fff', fontWeight: 600, lineHeight: '1.4' }}>
                        {ans1 ? currentQ?.[ans1] || ans1 : 'Chưa chọn'}
                      </div>
                    </div>
                    <div style={{
                      flex: 1, padding: '0.7rem 0.9rem', borderRadius: '12px',
                      background: 'rgba(253,38,125,0.1)', border: '1px solid rgba(253,38,125,0.25)',
                      fontSize: '0.82rem',
                    }}>
                      <div style={{ color: '#fd267d', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px' }}>💖 {match?.partner?.name || 'Đối phương'}:</div>
                      <div style={{ color: '#fff', fontWeight: 600, lineHeight: '1.4' }}>
                        {ans2 ? currentQ?.[ans2] || ans2 : 'Chưa chọn'}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    {currentQIdx >= questions.length - 1 ? 'Đang tổng hợp kết quả AI...' : 'Câu tiếp theo đang đến...'}
                  </div>
                </div>
              );
            })()
          )}

          {/* LOADING RESULT SCREEN */}
          {phase === 'PLAYING' && !currentQ && !revealAnswers && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
              <div style={{
                fontSize: '3rem', marginBottom: '1rem',
                animation: 'spin 2s linear infinite',
                display: 'inline-block',
              }}>🤖</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
                Đang phân tích kết quả & tính điểm ăn ý...
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                Gemini AI đang tổng hợp phản hồi của hai bạn 💫
              </div>
            </div>
          )}

          {/* PHASE: PAUSED — đối phương thoát */}
          {phase === 'PAUSED' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏸️</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
                Trò chơi tạm dừng
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {pausedReason}
                <br />
                Bạn có thể đóng cửa sổ này.
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: '0.8rem 2rem', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          )}

          {/* PHASE: RESULT */}
          {phase === 'RESULT' && result && (
            <div style={{ textAlign: 'center' }}>
              {/* AI Badge */}
              {result.aiPowered && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(253,38,125,0.15)', border: '1px solid rgba(253,38,125,0.3)',
                  borderRadius: '20px', padding: '4px 12px', marginBottom: '1rem',
                  fontSize: '0.75rem', color: '#fd267d', fontWeight: 600,
                }}>
                  🤖 Được đánh giá bởi Gemini AI
                </div>
              )}

              {/* Compatibility Score Circle */}
              <div style={{
                width: '86px', height: '86px', borderRadius: '50%',
                background: `conic-gradient(#fd267d ${result.compatibilityScore || result.compatibilityPct || 0}%, rgba(255,255,255,0.1) 0%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.6rem auto',
                boxShadow: '0 0 25px rgba(253,38,125,0.4)',
              }}>
                <div style={{
                  width: '66px', height: '66px', borderRadius: '50%',
                  background: '#12151a',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1.35rem', color: '#fd267d' }}>
                    {result.compatibilityScore || result.compatibilityPct || 0}%
                  </div>
                  <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Ăn ý</div>
                </div>
              </div>

              {/* Compatibility Label */}
              {(result.compatibilityLabel) && (
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '0.2rem' }}>
                  {result.compatibilityLabel}
                </div>
              )}

              {/* Basic stats */}
              {session?.gameType === 'SPIN_THE_BOTTLE' ? (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                  ✨ Đã hoàn thành 10 lượt xoay chai & mở lòng chia sẻ cùng nhau
                </div>
              ) : result.matches !== undefined && (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                  Giống nhau {result.matches}/{result.total || questions.length || 10} câu hỏi
                </div>
              )}

              {/* Unified AI Evaluation Report Container */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: '16px',
                padding: '1.2rem', marginBottom: '1.2rem', textAlign: 'left',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                {/* AI Summary Narrative */}
                {result.summary && (
                  <div style={{
                    fontSize: '0.92rem', color: '#f3f4f6', lineHeight: '1.65',
                    marginBottom: '1rem', background: 'rgba(253,38,125,0.06)',
                    padding: '0.9rem 1rem', borderRadius: '12px',
                    borderLeft: '4px solid #fd267d',
                  }}>
                    {result.summary}
                  </div>
                )}

                {/* AI Personality Highlights */}
                {result.highlights && result.highlights.length > 0 && (
                  <div style={{ marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#fd267d', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🌟 Điểm nổi bật & Tính cách
                    </div>
                    {result.highlights.map((h, i) => {
                      const cleanH = String(h).replace(/^Nhận xét chi tiết \d+:\s*/i, '').replace(/^Đánh giá chi tiết \d+:\s*/i, '');
                      return (
                        <div key={i} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', lineHeight: '1.5', marginBottom: '0.35rem', display: 'flex', gap: '0.4rem' }}>
                          <span>✨</span>
                          <span>{cleanH}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* AI Advice & Next Conversation Starter */}
                {result.advice && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(253,38,125,0.12))',
                    borderRadius: '12px', padding: '0.8rem 1rem',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: '#f472b6', fontSize: '0.85rem', lineHeight: '1.55',
                  }}>
                    💝 <strong>Lời khuyên & Gợi ý trò chuyện:</strong> {result.advice}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  onClick={() => { setPhase('SELECT'); setResult(null); setSession(null); }}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  🔄 Chơi lại
                </button>
                <button
                  onClick={handleCloseModal}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                    border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  💬 Quay lại chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
