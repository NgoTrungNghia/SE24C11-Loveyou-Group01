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

export default function GameModal({ match, currentUserId, onClose }) {
  const [phase, setPhase] = useState('SELECT'); // SELECT | WAITING | PLAYING | RESULT
  const [selectedGame, setSelectedGame] = useState(null);
  const [session, setSession] = useState(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [myAnswer, setMyAnswer] = useState(null);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [waitCount, setWaitCount] = useState(0);
  const [revealAnswers, setRevealAnswers] = useState(false);
  const socket = getSocket();
  const waitIntervalRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = ({ session: s }) => {
      setSession(s);
      setPhase('PLAYING');
      setCurrentQIdx(0);
      setMyAnswer(null);
      setPartnerAnswered(false);
    };

    const handleAnswerReceived = ({ userId, questionIndex }) => {
      if (Number(userId) !== currentUserId) {
        setPartnerAnswered(true);
      }
    };

    const handleBothAnswered = ({ sessionId, questionIndex, answers }) => {
      setRevealAnswers(true);
      setTimeout(() => {
        setRevealAnswers(false);
        setMyAnswer(null);
        setPartnerAnswered(false);
        setCurrentQIdx(prev => prev + 1);
      }, 2500);
    };

    const handleGameResult = ({ result: r }) => {
      setResult(r);
      setPhase('RESULT');
    };

    socket.on('game_started', handleGameStarted);
    socket.on('game_answer_received', handleAnswerReceived);
    socket.on('game_both_answered', handleBothAnswered);
    socket.on('game_result', handleGameResult);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('game_answer_received', handleAnswerReceived);
      socket.off('game_both_answered', handleBothAnswered);
      socket.off('game_result', handleGameResult);
    };
  }, [socket, currentUserId]);

  // Waiting timer animation
  useEffect(() => {
    if (phase === 'WAITING') {
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

  function finishGame() {
    if (!socket || !session) return;
    socket.emit('game_finish', { sessionId: session.sessionId });
  }

  const questions = session?.gameData?.questions || [];
  const currentQ = questions[currentQIdx];
  const isLastQuestion = currentQIdx >= questions.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'linear-gradient(145deg, #1a1e2e, #12151a)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(253,38,125,0.1)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fd267d, #ff6036)',
          padding: '1.2rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
            🎮 Mini Game
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
              borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '1.5rem' }}>

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
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '8px',
                marginBottom: '1rem',
              }}>
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
                  Câu {currentQIdx + 1} / {questions.length}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', lineHeight: '1.5' }}>
                  {session?.gameType === 'WOULD_YOU_RATHER' ? '🤔 Bạn thích cái nào hơn?' : '🍾 Câu hỏi cho bạn'}
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
                      <span style={{ opacity: 0.7, marginRight: '0.5rem' }}>{idx === 0 ? '🅰️' : '🅱️'}</span>
                      {currentQ[opt]}
                    </button>
                  ))}
                </div>
              )}

              {/* SPIN THE BOTTLE answer */}
              {session?.gameType === 'SPIN_THE_BOTTLE' && (
                <div>
                  <div style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '1rem 1.2rem',
                    color: '#fff', fontSize: '0.95rem', lineHeight: '1.6',
                    marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {currentQ}
                  </div>
                  {myAnswer === null && (
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={() => submitAnswer('answered')}
                        style={{
                          flex: 1, padding: '0.8rem', borderRadius: '12px',
                          background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                          border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        ✅ Đã trả lời
                      </button>
                      <button
                        onClick={() => submitAnswer('pass')}
                        style={{
                          padding: '0.8rem 1.2rem', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                        }}
                      >
                        ⏩ Bỏ qua
                      </button>
                    </div>
                  )}
                </div>
              )}

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
          {phase === 'PLAYING' && revealAnswers && currentQ && (
            <div style={{ textAlign: 'center', padding: '1rem 0', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>
                {session?.gameData?.answers[currentQIdx]?.[currentUserId] === session?.gameData?.answers[currentQIdx]?.[match?.partner?.id]
                  ? '🎉' : '🔀'}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>
                {session?.gameData?.answers[currentQIdx]?.[currentUserId] === session?.gameData?.answers[currentQIdx]?.[match?.partner?.id]
                  ? 'Hai bạn giống nhau!' : 'Hai bạn khác nhau!'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                Câu tiếp theo đang đến...
              </div>
            </div>
          )}

          {/* PHASE: RESULT */}
          {phase === 'RESULT' && result && (
            <div style={{ textAlign: 'center' }}>
              {result.gameType === 'WOULD_YOU_RATHER' && (
                <>
                  {/* Compatibility Score Circle */}
                  <div style={{
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: `conic-gradient(#fd267d ${result.compatibilityPct}%, rgba(255,255,255,0.1) 0%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.2rem auto',
                    boxShadow: '0 0 30px rgba(253,38,125,0.4)',
                  }}>
                    <div style={{
                      width: '90px', height: '90px', borderRadius: '50%',
                      background: '#12151a',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '1.6rem', color: '#fd267d' }}>{result.compatibilityPct}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Ăn ý</div>
                    </div>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>
                    {result.summary}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Giống nhau {result.matches}/{result.total} câu hỏi
                  </div>
                </>
              )}

              {result.gameType === 'SPIN_THE_BOTTLE' && (
                <>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
                    Xong rồi!
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    {result.summary}
                  </div>
                </>
              )}

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
                  onClick={onClose}
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
    </div>
  );
}
