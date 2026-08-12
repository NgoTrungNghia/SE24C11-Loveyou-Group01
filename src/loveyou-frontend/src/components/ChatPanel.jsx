import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '../utils/api';
import { getSocket } from '../utils/socket';

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';

export default function ChatPanel({ match, currentUserId, onClose, onInviteGame }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sending, setSending] = useState(false);
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
          const exists = prev.some(m => m.id === message.id);
          return exists ? prev : [...prev, message];
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
          id: Date.now(),
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
    </div>
  );
}
