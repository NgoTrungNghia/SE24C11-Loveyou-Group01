import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi, userApi } from '../utils/api';
import { getSocket } from '../utils/socket';
import ToastNotification from './ToastNotification';

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';

export default function ChatPanel({ match, currentUserId, onClose, onInviteGame, onBlockUser }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sending, setSending] = useState(false);

  // 3-dots menu & action states
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Quấy rối');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

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
          // 1. If message with exact DB ID already exists, ignore
          if (prev.some(m => m.id === message.id)) return prev;

          // 2. If this is our own sent message returning from socket server, replace optimistic message
          if (message.senderId === currentUserId) {
            const optIndex = prev.findIndex(m => m._optimistic && m.content === message.content);
            if (optIndex !== -1) {
              const updated = [...prev];
              updated[optIndex] = message;
              return updated;
            }
          }

          // 3. Otherwise append new message
          return [...prev, message];
        });

        // Mark as read if partner sent it
        if (message.senderId !== currentUserId) {
          socket.emit('mark_read', { conversationId: conversation.id });
        }
      }
    };

    const handlePartnerTyping = ({ userId, isTyping }) => {
      if (Number(userId) !== currentUserId) setPartnerTyping(isTyping);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('partner_typing', handlePartnerTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('partner_typing', handlePartnerTyping);
      socket.emit('leave_conversation', conversation.id);
    };
  }, [socket, conversation?.id, currentUserId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  async function initChat() {
    setIsLoading(true);
    try {
      const convRes = await chatApi.initConversation(match.matchId);
      const conv = convRes.data.data.conversation;
      setConversation(conv);

      const msgRes = await chatApi.getMessages(conv.id);
      setMessages(msgRes.data.data.messages || []);

      // Mark as read
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
    if (!content || !conversation?.id || sending) return;

    setSending(true);
    setInputText('');

    // Stop typing indicator
    if (socket) socket.emit('typing', { conversationId: conversation.id, isTyping: false });

    try {
      // Send via Socket.io for immediate broadcast
      if (socket?.connected) {
        socket.emit('send_message', { conversationId: conversation.id, content });
        // Optimistically add message
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
        // HTTP fallback
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
      const msg = `Đã chặn thành công ${match?.partner?.name || 'người dùng'}. Match đã bị hủy.`;
      if (onBlockUser) onBlockUser(match.matchId, targetId, msg);
      if (onClose) onClose();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi chặn người dùng' });
    } finally {
      setIsSubmitting(false);
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
        <img
          src={match?.partner?.photo || defaultAvatar}
          alt={match?.partner?.name}
          onError={e => { e.target.src = defaultAvatar; }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
            {match?.partner?.name || 'Partner'}
          </div>
          <div style={{ fontSize: '0.75rem', color: partnerTyping ? '#34D399' : 'rgba(255,255,255,0.5)' }}>
            {partnerTyping ? '✍️ Đang gõ...' : 'Đã match với bạn 💖'}
          </div>
        </div>

        {/* Invite Game Button */}
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
              <button
                onClick={() => { setShowMenu(false); setShowReportModal(true); }}
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
              Khi chặn, match giữa bạn và đối phương sẽ bị hủy. Cả 2 sẽ không thể nhắn tin hay tìm thấy nhau nữa.
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
              >{isSubmitting ? 'Đang chặn...' : 'Xác nhận Chặn'}</button>
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

      {/* Messages Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem',
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
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
      </div>
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
