import { useState, useEffect, useRef } from 'react';
import { supportApi } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export default function SupportChatModal({ onClose, currentUserProfile }) {
  const { user } = useAuth();
  const effectiveUser = currentUserProfile || user;
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSupportChat();
  }, []);

  // Socket realtime setup
  useEffect(() => {
    if (!conversation?.id) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_support_conversation', conversation.id);

    const handleNewMessage = (payload) => {
      if (payload.conversationId === conversation.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        scrollToBottom();
      }
    };

    socket.on('new_support_message', handleNewMessage);

    return () => {
      socket.emit('leave_support_conversation', conversation.id);
      socket.off('new_support_message', handleNewMessage);
    };
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSupportChat = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportApi.getMyConversation();
      setConversation(res.data.data.conversation);
      setMessages(res.data.data.messages || []);
    } catch (err) {
      console.error('Error loading support chat:', err);
      setError('Không thể tải cuộc trò chuyện hỗ trợ');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send_support_message', {
          conversationId: conversation?.id,
          content: text,
        });
      } else {
        const res = await supportApi.sendUserMessage(text);
        const newMsg = res.data.data.message;
        setMessages(prev => [...prev, newMsg]);
        if (res.data.data.conversation) {
          setConversation(res.data.data.conversation);
        }
      }
    } catch (err) {
      console.error('Failed to send support message:', err);
      setError('Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${time}, ${date}`;
    } catch {
      return '';
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.supportAvatarBox}>
              <span style={{ fontSize: '1.4rem' }}>🎧</span>
              <div style={styles.onlineDot} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                  Hỗ Trợ Khách Hàng
                </h3>
                <span style={styles.adminBadge}>👑 ADMIN TEAM</span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>
                • Sẵn sàng giải đáp
              </p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Support Greeting Banner */}
        <div style={styles.greetingBanner}>
          <span style={{ fontSize: '1rem' }}>💡</span>
          <span>Ban quản trị luôn sẵn sàng hỗ trợ bạn về thanh toán VIP, sự cố tài khoản hoặc góp ý tính năng.</span>
        </div>

        {/* Message Content */}
        <div style={styles.chatBody}>
          {loading ? (
            <div style={styles.loadingBox}>
              <div className="spinner" style={{ width: '24px', height: '24px', borderTopColor: '#FF2D55' }} />
              <span>Đang kết nối trung tâm hỗ trợ...</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>💬</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1rem' }}>Xin chào {effectiveUser?.fullName || effectiveUser?.username || 'bạn'}!</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', maxWidth: '280px', lineHeight: 1.5 }}>
                Bạn đang gặp vấn đề gì? Hãy gửi tin nhắn bên dưới, Ban quản trị sẽ phản hồi cho bạn sớm nhất.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, idx) => {
                const isMe = msg.senderRole === 'USER' || msg.senderId === user?.userId;
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                        marginLeft: isMe ? 0 : '4px',
                        marginRight: isMe ? '4px' : 0,
                        fontSize: '0.72rem',
                      }}
                    >
                      {isMe ? (
                        <>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>{formatTime(msg.createdAt)}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                          <span style={{ fontWeight: 700, color: '#FF6584' }}>
                            {effectiveUser?.fullName || effectiveUser?.username || 'Bạn'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 800, color: '#FFD700' }}>
                            👑 Admin
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>{formatTime(msg.createdAt)}</span>
                        </>
                      )}
                    </div>

                    <div
                      style={{
                        ...styles.bubble,
                        ...(isMe ? styles.userBubble : styles.adminBubble),
                      }}
                    >
                      <div style={{ wordBreak: 'break-word', lineHeight: 1.45 }}>{msg.content}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={styles.inputBar}>
          <input
            type="text"
            placeholder="Nhập nội dung cần hỗ trợ (nhấn Enter để gửi)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={loading || sending}
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading || sending || !inputText.trim()}
            style={{
              ...styles.sendBtn,
              opacity: !inputText.trim() || sending ? 0.5 : 1,
              cursor: !inputText.trim() || sending ? 'default' : 'pointer',
            }}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    background: '#13171F',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '24px',
    width: '460px',
    maxWidth: '96vw',
    height: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
  },
  header: {
    padding: '1rem 1.2rem',
    background: 'linear-gradient(135deg, rgba(255,45,85,0.12), rgba(255,100,50,0.06))',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supportAvatarBox: {
    position: 'relative',
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #FF2D55, #FF5500)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(255,45,85,0.3)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    border: '2px solid #13171F',
  },
  adminBadge: {
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000',
    fontSize: '0.65rem',
    fontWeight: 900,
    padding: '2px 6px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  greetingBanner: {
    padding: '0.6rem 1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
    color: '#93C5FD',
    fontSize: '0.76rem',
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  chatBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.85rem',
  },
  emptyBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '2rem',
  },
  bubble: {
    maxWidth: '82%',
    padding: '0.75rem 1rem',
    borderRadius: '18px',
    fontSize: '0.88rem',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #FF2D55, #FF5500)',
    color: '#fff',
    borderBottomRightRadius: '4px',
    boxShadow: '0 4px 15px rgba(255,45,85,0.25)',
  },
  adminBubble: {
    background: '#1F2937',
    color: '#F9FAFB',
    border: '1px solid rgba(255,255,255,0.1)',
    borderBottomLeftRadius: '4px',
  },
  inputBar: {
    padding: '0.8rem 1rem',
    background: '#181D26',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding: '0.75rem 1rem',
    color: '#fff',
    fontSize: '0.88rem',
    outline: 'none',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #FF2D55, #FF5500)',
    border: 'none',
    color: '#fff',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(255,45,85,0.3)',
    transition: 'all 0.2s',
  },
};
