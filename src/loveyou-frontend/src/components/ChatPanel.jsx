import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi, userApi } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge, { isFullyVerified } from './VerifiedBadge';

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';

export default function ChatPanel({ match, currentUserId, currentUserProfile, isOnline, onClose, onInviteGame, onBlockUser, onUnblockUser }) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sending, setSending] = useState(false);

  // 3-dots menu & action states
  const [isBlockedState, setIsBlockedState] = useState(match?.partner?.isBlocked || match?.isBlocked || false);
  const [isBlockedByMeState, setIsBlockedByMeState] = useState(match?.partner?.isBlockedByMe || match?.isBlockedByMe || false);
  const [isBlockedByPartnerState, setIsBlockedByPartnerState] = useState(match?.partner?.isBlockedByPartner || match?.isBlockedByPartner || false);
  const [isUnmatchedState, setIsUnmatchedState] = useState(Boolean(match?.partner?.isUnmatched || match?.isUnmatched));
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRedFlagModal, setShowRedFlagModal] = useState(false);
  const [isAnalyzingRedFlag, setIsAnalyzingRedFlag] = useState(false);
  const [redFlagResult, setRedFlagResult] = useState(null);
  const [reportReason, setReportReason] = useState('Quấy rối');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setIsBlockedState(match?.partner?.isBlocked || match?.isBlocked || false);
    setIsBlockedByMeState(match?.partner?.isBlockedByMe || match?.isBlockedByMe || false);
    setIsBlockedByPartnerState(match?.partner?.isBlockedByPartner || match?.isBlockedByPartner || false);
    setIsUnmatchedState(Boolean(match?.partner?.isUnmatched || match?.isUnmatched));
  }, [match]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initialize conversation
  useEffect(() => {
    if (!match?.matchId) return;
    initChat();
  }, [match?.matchId]);

  // Socket events
  useEffect(() => {
    if (!socket || !conversation?.id) return;

    socket.emit('join_conversation', conversation.id);

    const handleNewMessage = ({ message, conversationId }) => {
      if (Number(conversationId) === conversation.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          const filtered = prev.filter(m => !m._optimistic || m.content !== message.content);
          return [...filtered, message];
        });
      }
    };

    const handleTypingStatus = ({ conversationId, userId, isTyping: typing }) => {
      if (Number(conversationId) === conversation.id && Number(userId) !== currentUserId) {
        setPartnerTyping(typing);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_status', handleTypingStatus);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_status', handleTypingStatus);
    };
  }, [conversation?.id, currentUserId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping, scrollToBottom]);

  async function initChat() {
    setIsLoading(true);
    try {
      const convRes = await chatApi.initConversation(match.matchId);
      const conv = convRes.data.data.conversation;
      setConversation(conv);

      const msgRes = await chatApi.getMessages(conv.id);
      setMessages(msgRes.data.data.messages || []);

      socket?.emit('mark_read', { conversationId: conv.id });
    } catch (err) {
      console.error('Chat init error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleTyping(e) {
    setInputText(e.target.value);
    if (!socket || !conversation?.id) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { conversationId: conversation.id, isTyping: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { conversationId: conversation.id, isTyping: false });
    }, 1500);
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || !conversation?.id || sending || isUnmatchedState) return;

    setSending(true);
    setInputText('');

    if (socket) socket.emit('typing', { conversationId: conversation.id, isTyping: false });

    try {
      if (socket?.connected) {
        socket.emit('send_message', { conversationId: conversation.id, content });
        const optimisticMsg = {
          id: `temp_${Date.now()}`,
          content,
          senderId: currentUserId,
          type: 'TEXT',
          readAt: null,
          createdAt: new Date().toISOString(),
          sender: { userId: currentUserId },
          _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);
      } else {
        const res = await chatApi.sendMessage(conversation.id, content);
        setMessages(prev => [...prev, res.data.data.message]);
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  }

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  async function handleConfirmBlock() {
    const targetId = match?.partner?.id || match?.partner?.userId;
    if (!targetId) return;
    setIsSubmitting(true);
    try {
      await userApi.blockUser(targetId);
      setShowBlockConfirm(false);
      setIsBlockedState(true);
      setIsBlockedByMeState(true);
      const msg = `Đã chặn thành công ${match?.partner?.name || 'người dùng'}.`;
      setToast({ type: 'success', message: msg });
      if (onBlockUser) onBlockUser(match.matchId, targetId, msg);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi chặn người dùng' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmUnblock() {
    const targetId = match?.partner?.id || match?.partner?.userId;
    if (!targetId) return;
    setIsSubmitting(true);
    try {
      await userApi.unblockUser(targetId);
      setShowUnblockConfirm(false);
      setIsBlockedByMeState(false);
      setIsBlockedState(isBlockedByPartnerState);
      const msg = `Đã bỏ chặn thành công ${match?.partner?.name || 'người dùng'}.`;
      setToast({ type: 'success', message: msg });
      if (onUnblockUser) onUnblockUser(match.matchId, targetId, msg);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi bỏ chặn người dùng' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmClear() {
    if (!conversation?.id) return;
    setIsSubmitting(true);
    try {
      await chatApi.clearConversation(conversation.id);
      setMessages([]);
      setShowClearConfirm(false);
      setToast({ type: 'success', message: 'Đã xóa toàn bộ trò chuyện phía bạn thành công' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi xóa trò chuyện' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalyzeRedFlags() {
    if (!conversation?.id) return;
    setIsAnalyzingRedFlag(true);
    setRedFlagResult(null);
    try {
      const res = await chatApi.detectRedFlags(conversation.id);
      setRedFlagResult(res.data.data.analysis);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi phân tích Red Flag bằng AI' });
      setShowRedFlagModal(false);
    } finally {
      setIsAnalyzingRedFlag(false);
    }
  }

  async function handleSubmitReport() {
    const targetId = match?.partner?.id || match?.partner?.userId;
    if (!targetId) return;
    const finalReason = reportReason === 'Khác' ? customReason.trim() || 'Khác' : reportReason;
    setIsSubmitting(true);
    try {
      await userApi.reportUser(targetId, finalReason);
      setShowReportModal(false);
      setToast({ type: 'success', message: 'Đã gửi báo cáo thành công. Cảm ơn bạn đã hỗ trợ giữ gìn cộng đồng an toàn!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi gửi báo cáo' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = null;
    msgs.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msg.createdAt, key: `date_${msg.createdAt}` });
      }
      groups.push({ type: 'message', ...msg });
    });
    return groups;
  };

  const grouped = groupMessagesByDate(messages);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0f1115', borderRadius: '16px', overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.8rem',
        padding: '1rem 1.2rem',
        background: '#181c22',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div className={(match?.partner?.isVip || match?.isVip) ? 'vip-avatar-glow' : ''} style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={match?.partner?.photo || defaultAvatar}
            alt={match?.partner?.name}
            onError={e => { e.target.src = defaultAvatar; }}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          {isOnline && (
            <div style={{
              position: 'absolute', bottom: '1px', right: '1px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#34D399', border: '2px solid #181c22',
            }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{match?.partner?.name || 'Partner'}</span>
            {isFullyVerified(match?.partner || match) && (
              <VerifiedBadge size={16} />
            )}
            {(match?.partner?.isVip || match?.isVip) && (
              <span className="vip-badge-gradient" style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px' }}>👑 VIP</span>
            )}
            {isBlockedState ? (
              <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '1px 6px', borderRadius: '6px', fontWeight: 600 }}>
                Đã chặn
              </span>
            ) : isUnmatchedState ? (
              <span style={{ fontSize: '0.7rem', background: 'rgba(255,68,88,0.2)', color: '#ff6b8a', padding: '1px 6px', borderRadius: '6px', fontWeight: 600 }}>
                Đã hủy match
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: '0.75rem', color: isUnmatchedState ? '#ff6b8a' : (partnerTyping || isOnline) ? '#34D399' : 'rgba(255,255,255,0.5)' }}>
            {isUnmatchedState ? '💔 Đã hủy ghép đôi' : partnerTyping ? '✍️ Đang gõ...' : isOnline ? '🟢 Đang hoạt động' : 'Đã match với bạn 💖'}
          </div>
        </div>

        {/* Invite Game Button (only if actively matched) */}
        {!isUnmatchedState && !isBlockedState && (
          <button
            onClick={() => onInviteGame && onInviteGame(match)}
            title="Mời chơi game"
            style={{
              background: 'rgba(253,38,125,0.15)', border: '1px solid rgba(253,38,125,0.4)',
              color: '#fd267d', borderRadius: '10px', padding: '0.4rem 0.8rem',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            🎮 Chơi game
          </button>
        )}

        {/* 3-dots Menu Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(prev => !prev)}
            title="Tùy chọn khác"
            style={{
              background: showMenu ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              border: 'none', color: '#fff',
              borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer',
              fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >⋮</button>

          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '44px', zIndex: 100,
              background: '#232830', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px', padding: '0.4rem', width: '190px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            }}>
              <button
                onClick={() => { setShowMenu(false); setShowClearConfirm(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                  padding: '0.6rem 0.8rem', background: 'transparent', border: 'none',
                  color: '#9CA3AF', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem',
                  fontWeight: 600, textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🗑️ Xóa trò chuyện
              </button>

              {isBlockedByMeState ? (
                <button
                  onClick={() => { setShowMenu(false); setShowUnblockConfirm(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                    padding: '0.6rem 0.8rem', background: 'transparent', border: 'none',
                    color: '#34D399', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem',
                    fontWeight: 600, textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🔓 Bỏ chặn người dùng
                </button>
              ) : (
                <button
                  onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                    padding: '0.6rem 0.8rem', background: 'transparent', border: 'none',
                    color: '#EF4444', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem',
                    fontWeight: 600, textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚫 Chặn người dùng
                </button>
              )}

              <button
                onClick={() => { setShowMenu(false); setShowRedFlagModal(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                  padding: '0.6rem 0.8rem', background: 'transparent', border: 'none',
                  color: '#EC4899', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem',
                  fontWeight: 600, textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,72,153,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🚩 Phân tích Red Flag (AI)
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  const effectiveProfile = currentUserProfile || user;
                  if (effectiveProfile?.role !== 'ADMIN' && (!effectiveProfile?.isEmailVerified || !effectiveProfile?.isCitizenVerified)) {
                    setToast({
                      type: 'warning',
                      message: '⚠️ Chỉ những tài khoản đã xác thực đầy đủ (Email & CCCD) mới có thể gửi báo cáo người dùng. Vui lòng vào Cài Đặt để xác thực.',
                    });
                    return;
                  }
                  setShowReportModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                  padding: '0.6rem 0.8rem', background: 'transparent', border: 'none',
                  color: '#F59E0B', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem',
                  fontWeight: 600, textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                ⚠️ Báo cáo người dùng
              </button>
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)',
              borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '1rem',
            }}
          >✕</button>
        )}
      </div>

      {/* Clear Conversation Confirm Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#1A1D24', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px', padding: '1.8rem', width: '100%', maxWidth: '380px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)', color: '#fff', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Xóa trò chuyện phía bạn?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Thao tác này chỉ xóa lịch sử tin nhắn phía bạn. Người dùng <strong style={{ color: '#fff' }}>{match?.partner?.name}</strong> vẫn giữ nguyên lịch sử tin nhắn bình thường.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}
              >Hủy bỏ</button>
              <button
                onClick={handleConfirmClear}
                disabled={isSubmitting}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px',
                  background: '#EF4444', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                  boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
                }}
              >{isSubmitting ? 'Đang xóa...' : 'Xóa phía tôi'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#1e232a', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '16px', padding: '1.5rem', maxWidth: '380px', width: '100%',
            color: '#fff', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚫</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#fff' }}>
              Chặn {match?.partner?.name}?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Khi chặn, đối phương sẽ không thể nhắn tin mới cho bạn nhưng lịch sử nhắn tin vẫn được giữ nguyên an toàn.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowBlockConfirm(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >Hủy</button>
              <button
                onClick={handleConfirmBlock}
                disabled={isSubmitting}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >{isSubmitting ? 'Đang chặn...' : 'Chặn'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Confirm Modal */}
      {showUnblockConfirm && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#1e232a', border: '1px solid rgba(52,211,153,0.4)',
            borderRadius: '16px', padding: '1.5rem', maxWidth: '380px', width: '100%',
            color: '#fff', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔓</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#fff' }}>
              Bỏ chặn {match?.partner?.name}?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Bạn có chắc chắn muốn bỏ chặn người dùng này? Hai bạn sẽ có thể tiếp tục nhắn tin bình thường.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowUnblockConfirm(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >Hủy</button>
              <button
                onClick={handleConfirmUnblock}
                disabled={isSubmitting}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >{isSubmitting ? 'Đang bỏ chặn...' : 'Bỏ chặn'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#1e232a', border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: '16px', padding: '1.5rem', maxWidth: '380px', width: '100%',
            color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                Báo cáo {match?.partner?.name}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer' }}
              >✕</button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.8rem' }}>
              Chọn lý do báo cáo:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.8rem' }}>
              {['Quấy rối', 'Ngôn từ khiếm nhã', 'Khác'].map(reason => (
                <label key={reason} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  height: '42px', padding: '0 0.8rem', borderRadius: '10px',
                  boxSizing: 'border-box',
                  background: reportReason === reason ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  border: reportReason === reason ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#fff',
                  transition: 'all 0.2s ease',
                }}>
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    style={{ accentColor: '#F59E0B', width: '16px', height: '16px', margin: 0 }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {reportReason === 'Khác' && (
              <textarea
                rows={3}
                placeholder="Mô tả thêm chi tiết vi phạm..."
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', marginTop: '0.2rem', marginBottom: '0.6rem',
                  padding: '0.7rem', borderRadius: '8px', background: '#121519',
                  border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem',
                  outline: 'none', resize: 'none',
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setShowReportModal(false)}
                disabled={isSubmitting}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}
              >Hủy</button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}
              >{isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.2rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '3rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
            <div>Đang tải tin nhắn...</div>
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              Hai bạn vừa match nhau!
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
              Hãy bắt đầu trò chuyện hoặc mời nhau chơi game 🎮
            </div>
          </div>
        ) : (
          grouped.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} style={{
                  textAlign: 'center', margin: '0.8rem 0',
                  color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem',
                }}>
                  ── {formatDate(item.date)} ──
                </div>
              );
            }

            const isMe = item.senderId === currentUserId;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.3rem',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {!isMe && (
                  <img
                    src={match?.partner?.photo || defaultAvatar}
                    alt=""
                    onError={e => { e.target.src = defaultAvatar; }}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    background: isMe
                      ? 'linear-gradient(135deg, #fd267d, #ff6036)'
                      : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '0.6rem 0.9rem',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: '0.88rem',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    boxShadow: isMe ? '0 4px 15px rgba(253,38,125,0.3)' : 'none',
                  }}>
                    {item.content}
                  </div>
                  <div style={{
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)',
                    textAlign: isMe ? 'right' : 'left', marginTop: '2px',
                    display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                    gap: '0.3rem', alignItems: 'center',
                  }}>
                    {formatTime(item.createdAt)}
                    {isMe && (
                      <span style={{ color: item.readAt ? '#34D399' : 'rgba(255,255,255,0.4)' }}>
                        {item.readAt ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {partnerTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img
              src={match?.partner?.photo || defaultAvatar}
              alt=""
              onError={e => { e.target.src = defaultAvatar; }}
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '0.6rem 1rem',
              borderRadius: '18px 18px 18px 4px',
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.6)',
                  animation: `typingBounce 1.2s ease infinite`,
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '0.8rem 1rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: '#181c22',
        flexShrink: 0,
      }}>
        {isBlockedState ? (
          <div style={{
            textAlign: 'center',
            padding: '0.7rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            color: '#ef4444',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            {isBlockedByMeState
              ? '🚫 Bạn đang chặn tài khoản này. Không thể gửi tin nhắn mới.'
              : '🚫 Đối phương đang chặn bạn. Không thể gửi tin nhắn mới.'}
          </div>
        ) : isUnmatchedState ? (
          <div style={{
            textAlign: 'center',
            padding: '0.85rem 1rem',
            background: 'linear-gradient(145deg, rgba(255, 68, 88, 0.12), rgba(253, 38, 125, 0.08))',
            border: '1px solid rgba(255, 68, 88, 0.3)',
            borderRadius: '16px',
            color: '#ff6b8a',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff4458', fontWeight: 700 }}>
              <span>💔</span>
              <span>Hai bạn đã hủy ghép đôi. Không thể gửi tin nhắn mới.</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Cần ghép đôi lại trên LoveYou để tiếp tục trò chuyện cùng nhau.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <input
              type="text"
              value={inputText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Nhắn tin cho nhau... 💬"
              disabled={sending || isLoading}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px',
                padding: '0.7rem 1.2rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending || isLoading}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: inputText.trim() ? 'linear-gradient(135deg, #fd267d, #ff6036)' : 'rgba(255,255,255,0.1)',
                border: 'none', color: '#fff', cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {sending ? '⏳' : '➤'}
            </button>
          </form>
        )}
      </div>
      {/* ── RED FLAG AI ANALYSIS MODAL ── */}
      {showRedFlagModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2200,
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #181c24, #12151b)',
            border: '1px solid rgba(236,72,153,0.3)',
            borderRadius: '24px', padding: '1.8rem', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(236,72,153,0.15)',
            color: '#fff', maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Modal Title Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>🚩</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                    Phân tích Red Flag bằng AI
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#EC4899', fontWeight: 600 }}>
                    Powered by Gemini AI 🤖
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setShowRedFlagModal(false); setRedFlagResult(null); }}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
                  borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            {/* CASE 1: INITIAL EXPLANATION & CONSENT CONFIRMATION */}
            {!isAnalyzingRedFlag && !redFlagResult && (
              <div>
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6',
                }}>
                  <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    Tính năng này sẽ gửi <strong style={{ color: '#EC4899' }}>tối đa 100 tin nhắn gần nhất</strong> trong cuộc trò chuyện này tới Gemini AI để kiểm tra các rủi ro và dấu hiệu bất thường.
                  </p>
                  <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>🚨 <strong>Dấu hiệu lừa đảo & giả mạo:</strong> Yêu cầu chuyển tiền, OTP, liên kết lạ, dụ dỗ đầu tư.</div>
                    <div>🧠 <strong>Thao túng tâm lý:</strong> Love bombing (dồn dập), gaslighting, thúc ép gặp mặt / riêng tư quá đà.</div>
                    <div>⚠️ <strong>Thái độ độc hại:</strong> Ngôn từ thô lỗ, ghen tuông vô lý, ngắt lời hoặc đe dọa.</div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)',
                  borderRadius: '12px', padding: '0.8rem 1rem', fontSize: '0.78rem', color: '#EC4899',
                  marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  🔒 Bản phân tích chỉ hiển thị duy nhất cho bạn. Chúng tôi cam kết bảo vệ quyền riêng tư của cuộc hội thoại.
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowRedFlagModal(false)}
                    style={{
                      padding: '0.7rem 1.2rem', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.08)', border: 'none',
                      color: 'rgba(255,255,255,0.7)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleAnalyzeRedFlags}
                    style={{
                      padding: '0.7rem 1.4rem', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', border: 'none',
                      color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                      boxShadow: '0 4px 15px rgba(236,72,153,0.4)',
                    }}
                  >
                    🚀 Đồng ý & Phân tích ngay
                  </button>
                </div>
              </div>
            )}

            {/* CASE 2: LOADING STATE */}
            {isAnalyzingRedFlag && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1.2rem auto', width: '42px', height: '42px', borderColor: '#EC4899 #EC4899 transparent transparent' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Gemini AI đang phân tích 100 tin nhắn gần nhất...
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  Vui lòng chờ trong giây lát để có báo cáo an toàn chi tiết.
                </p>
              </div>
            )}

            {/* CASE 3: ANALYSIS RESULT */}
            {!isAnalyzingRedFlag && redFlagResult && (() => {
              const { riskLevel, safetyScore, summary, redFlags, greenFlags, advice } = redFlagResult;
              const isDanger = riskLevel === 'DANGER';
              const isCaution = riskLevel === 'CAUTION';

              const badgeColor = isDanger ? '#EF4444' : isCaution ? '#F59E0B' : '#10B981';
              const badgeBg = isDanger ? 'rgba(239,68,68,0.15)' : isCaution ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)';
              const badgeBorder = isDanger ? 'rgba(239,68,68,0.4)' : isCaution ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)';
              const badgeText = isDanger ? '🔴 CẢNH BÁO NGUY HIỂM' : isCaution ? '🟡 CẦN CHÚ Ý' : '🟢 AN TOÀN - THÂN THIỆN';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {/* Risk Badge & Safety Score */}
                  <div style={{
                    background: badgeBg, border: `1px solid ${badgeBorder}`,
                    borderRadius: '16px', padding: '1rem 1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ color: badgeColor, fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px' }}>
                        {badgeText}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
                        Đánh giá dựa trên 100 tin nhắn gần nhất
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: badgeColor, lineHeight: '1' }}>
                        {safetyScore}<span style={{ fontSize: '0.85rem' }}>/100</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        Điểm An Toàn
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#EC4899', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📝 Nhận xét của AI:
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.55' }}>
                      {summary}
                    </p>
                  </div>

                  {/* Red Flags List */}
                  {redFlags && redFlags.length > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#EF4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        🚩 Cảnh báo Red Flag phát hiện:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {redFlags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Green Flags List */}
                  {greenFlags && greenFlags.length > 0 && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10B981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        💚 Điểm tích cực (Green Flags):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {greenFlags.map((gflag, idx) => (
                          <li key={idx}>{gflag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Advice */}
                  <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '14px', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#A78BFA', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      💡 Lời khuyên an toàn:
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>
                      {advice}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    {isDanger && !isBlockedByMeState && (
                      <button
                        onClick={() => {
                          setShowRedFlagModal(false);
                          setShowBlockConfirm(true);
                        }}
                        style={{
                          padding: '0.65rem 1.2rem', borderRadius: '12px',
                          background: '#EF4444', border: 'none', color: '#fff',
                          fontWeight: 700, cursor: 'pointer', fontSize: '0.83rem',
                        }}
                      >
                        🚫 Chặn ngay đối phương
                      </button>
                    )}
                    <button
                      onClick={() => { setShowRedFlagModal(false); setRedFlagResult(null); }}
                      style={{
                        padding: '0.65rem 1.4rem', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                        fontWeight: 600, cursor: 'pointer', fontSize: '0.83rem',
                      }}
                    >
                      Đóng báo cáo
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
