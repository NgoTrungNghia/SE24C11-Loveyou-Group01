import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, supportApi } from '../utils/api';
import { connectSocket, getSocket } from '../utils/socket';
import ToastNotification from '../components/ToastNotification';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' | 'REPORTS' | 'SUPPORT' | 'AI_CONFIG'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, BANNED
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, ADMIN, USER_VIP, USER_NORMAL
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportActionLoading, setReportActionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Support Chat state
  const [supportConversations, setSupportConversations] = useState([]);
  const [selectedSupportConv, setSelectedSupportConv] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingAdminReply, setSendingAdminReply] = useState(false);
  const [loadingSupportMessages, setLoadingSupportMessages] = useState(false);
  const [supportSearch, setSupportSearch] = useState('');
  const [showNewChatSelector, setShowNewChatSelector] = useState(false);
  const supportChatEndRef = useRef(null);

  // AI Config state
  const [apiKeyInfo, setApiKeyInfo] = useState({ masked: null, hasKey: false });
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Online Presence state
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    loadData();
    const token = localStorage.getItem('ly_token');
    if (token) {
      const socket = connectSocket(token);
      if (socket) {
        socket.on('initial_online_users', ({ userIds }) => {
          if (Array.isArray(userIds)) {
            setOnlineUsers(new Set(userIds.map(Number)));
          }
        });
        socket.on('user_online', ({ userId }) => {
          setOnlineUsers(prev => new Set([...prev, Number(userId)]));
        });
        socket.on('user_offline', ({ userId }) => {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            next.delete(Number(userId));
            return next;
          });
        });
        socket.emit('get_online_users');
      }
    }
  }, []);

  // Realtime Socket listener for Admin Support
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_admin_support_channel');

    const handleSupportUpdated = (payload) => {
      const updated = payload.conversation;
      if (!updated) return;
      setSupportConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === updated.id);
        let newList;
        if (existingIndex >= 0) {
          newList = [...prev];
          newList[existingIndex] = { ...newList[existingIndex], ...updated };
        } else {
          newList = [updated, ...prev];
        }
        return newList.sort((a, b) => {
          const aUnread = (a.adminUnreadCount > 0 ? 1 : 0);
          const bUnread = (b.adminUnreadCount > 0 ? 1 : 0);
          if (aUnread !== bUnread) return bUnread - aUnread;
          return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
        });
      });
    };

    const handleNewSupportMsg = (payload) => {
      if (selectedSupportConv && payload.conversationId === selectedSupportConv.id) {
        setSupportMessages(prev => {
          if (prev.some(m => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        setTimeout(() => supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    socket.on('admin_support_updated', handleSupportUpdated);
    socket.on('new_support_message', handleNewSupportMsg);

    return () => {
      socket.emit('leave_admin_support_channel');
      socket.off('admin_support_updated', handleSupportUpdated);
      socket.off('new_support_message', handleNewSupportMsg);
    };
  }, [selectedSupportConv?.id]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, reportsRes, supportRes, apiKeyRes] = await Promise.all([
        adminApi.stats(),
        adminApi.getUsers(),
        adminApi.getReports(),
        supportApi.getAdminConversations().catch(() => ({ data: { data: { conversations: [] } } })),
        adminApi.getApiKey().catch(() => ({ data: { data: { masked: null, hasKey: false } } })),
      ]);
      setStats(statsRes.data.data.stats);
      setUsers(usersRes.data.data.users || []);
      setReports(reportsRes.data.data.reports || []);
      setSupportConversations(supportRes.data.data.conversations || []);
      setApiKeyInfo(apiKeyRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Không thể tải dữ liệu quản trị');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSupportConversation = async (conv) => {
    setSelectedSupportConv(conv);
    setLoadingSupportMessages(true);
    try {
      const res = await supportApi.getAdminConversationMessages(conv.id);
      setSupportMessages(res.data.data.messages || []);
      // Reset unread count locally in list
      setSupportConversations(prev => prev.map(c => c.id === conv.id ? { ...c, adminUnreadCount: 0 } : c));
      const socket = getSocket();
      if (socket) {
        socket.emit('join_support_conversation', conv.id);
        socket.emit('mark_support_read', { conversationId: conv.id });
      }
      setTimeout(() => supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to load support messages:', err);
      setToast({ type: 'error', message: 'Không thể tải tin nhắn hỗ trợ' });
    } finally {
      setLoadingSupportMessages(false);
    }
  };

  const handleOpenSupportWithUser = async (targetUser) => {
    if (!targetUser?.userId) return;
    setSelectedUser(null);
    setActiveTab('SUPPORT');
    setLoadingSupportMessages(true);
    try {
      const res = await supportApi.getAdminConversationByUserId(targetUser.userId);
      const conv = res.data.data.conversation;
      const msgs = res.data.data.messages || [];
      setSelectedSupportConv(conv);
      setSupportMessages(msgs);
      setSupportConversations(prev => {
        const exists = prev.some(c => c.id === conv.id);
        if (!exists) {
          return [conv, ...prev];
        }
        return prev.map(c => c.id === conv.id ? { ...c, adminUnreadCount: 0 } : c);
      });
      const socket = getSocket();
      if (socket) {
        socket.emit('join_support_conversation', conv.id);
        socket.emit('mark_support_read', { conversationId: conv.id });
      }
      setTimeout(() => supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to open support chat with user:', err);
      setToast({ type: 'error', message: 'Không thể mở hội thoại hỗ trợ' });
    } finally {
      setLoadingSupportMessages(false);
    }
  };

  const handleSendAdminReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSupportConv || !adminReplyText.trim() || sendingAdminReply) return;
    const text = adminReplyText.trim();
    setSendingAdminReply(true);
    setAdminReplyText('');

    try {
      // Always use HTTP API as primary - reliable and guaranteed
      const res = await supportApi.sendAdminMessage(selectedSupportConv.id, text);
      const newMsg = res.data.data.message;
      const updatedConv = res.data.data.conversation;

      // Add message to local state immediately
      setSupportMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setSupportConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));

      // Also emit via socket for other admins to receive realtime (best-effort)
      const socket = getSocket();
      if (socket && socket.connected) {
        // Ensure we're in the room first
        socket.emit('join_support_conversation', selectedSupportConv.id);
      }

      setTimeout(() => supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to send admin reply:', err);
      setAdminReplyText(text); // restore text on failure
      const serverMsg = err.response?.data?.error?.message || 'Không thể gửi phản hồi. Vui lòng thử lại.';
      setToast({ type: 'error', message: serverMsg });
    } finally {
      setSendingAdminReply(false);
    }
  };

  const handleBanAccAndResolveReport = async (report) => {
    if (!report || reportActionLoading) return;
    const reported = report.reported;
    setReportActionLoading(true);
    try {
      // 1. Ban user if not already banned
      if (reported?.userId && reported.status !== 'BANNED') {
        const banRes = await adminApi.toggleBan(reported.userId);
        const updatedUser = banRes.data.data.user;
        setUsers(prev => prev.map(u => u.userId === updatedUser.userId ? { ...u, status: updatedUser.status } : u));
      }

      // 2. Mark report as RESOLVED with resolution = 'BAN_ACC'
      const repRes = await adminApi.updateReportStatus(report.id, 'RESOLVED', 'BAN_ACC');
      const updatedReport = repRes.data.data.report;
      setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));

      setToast({
        type: 'success',
        message: `Đã khóa tài khoản "${reported?.fullName || reported?.username || 'người dùng'}" và cập nhật hướng giải quyết: Ban acc!`,
      });
      setSelectedReport(null);
    } catch (err) {
      console.error('Failed to ban & resolve report:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi xử lý báo cáo',
      });
    } finally {
      setReportActionLoading(false);
    }
  };

  const handleDismissAndResolveReport = async (report) => {
    if (!report || reportActionLoading) return;
    setReportActionLoading(true);
    try {
      // Mark report as RESOLVED with resolution = 'DISMISSED'
      const repRes = await adminApi.updateReportStatus(report.id, 'RESOLVED', 'DISMISSED');
      const updatedReport = repRes.data.data.report;
      setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));

      setToast({
        type: 'success',
        message: 'Đã cập nhật hướng giải quyết: Bỏ qua báo cáo.',
      });
      setSelectedReport(null);
    } catch (err) {
      console.error('Failed to dismiss & resolve report:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái',
      });
    } finally {
      setReportActionLoading(false);
    }
  };

  const handleToggleBan = async (u) => {
    const isBanned = u.status === 'BANNED';
    const actionName = isBanned ? 'MỞ KHÓA (Unban)' : 'KHÓA (Ban)';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản ${u.email}?`)) return;

    setActionLoading(u.userId);
    try {
      const res = await adminApi.toggleBan(u.userId);
      const updated = res.data.data.user;

      setUsers(prev => prev.map(item => item.userId === updated.userId ? { ...item, status: updated.status } : item));

      if (selectedUser?.userId === updated.userId) {
        setSelectedUser(prev => prev ? { ...prev, status: updated.status } : null);
      }

      const statsRes = await adminApi.stats();
      setStats(statsRes.data.data.stats);
      setToast({ type: 'success', message: `Đã ${updated.status === 'BANNED' ? 'khóa' : 'mở khóa'} tài khoản ${u.email}` });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Thao tác thất bại' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) return;
    setSavingApiKey(true);
    try {
      await adminApi.setApiKey(newApiKey.trim());
      const res = await adminApi.getApiKey();
      setApiKeyInfo(res.data.data);
      setNewApiKey('');
      setShowApiKey(false);
      setToast({ type: 'success', message: '✅ Đã lưu Gemini API key thành công!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể lưu API key' });
    } finally {
      setSavingApiKey(false);
    }
  };

  const getOnlineStatus = (u) => {
    if (!u) return { isOnline: false, text: 'Ngoại tuyến' };
    const isOnline = onlineUsers.has(Number(u.userId)) || Number(u.userId) === Number(user?.userId);
    if (isOnline) return { isOnline: true, text: 'Online' };
    if (!u.lastActiveAt) return { isOnline: false, text: 'Chưa online' };
    const diffMs = Date.now() - new Date(u.lastActiveAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return { isOnline: false, text: 'Vừa mới' };
    if (diffMin < 60) return { isOnline: false, text: `${diffMin}m trước` };
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return { isOnline: false, text: `${diffHours}h trước` };
    const diffDays = Math.floor(diffHours / 24);
    return { isOnline: false, text: `${diffDays}d trước` };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesQuery = (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
    if (!matchesQuery) return false;
    if (statusFilter === 'ACTIVE' && u.status !== 'ACTIVE') return false;
    if (statusFilter === 'BANNED' && u.status !== 'BANNED') return false;

    if (roleFilter === 'ADMIN') return u.role === 'ADMIN';
    if (roleFilter === 'USER_VIP') return u.role === 'USER' && Boolean(u.isVip);
    if (roleFilter === 'USER_NORMAL') return u.role === 'USER' && !u.isVip;
    return true;
  });

  const currentAdmin = users.find(u => Number(u.userId) === Number(user?.userId)) || user;

  return (
    <div style={styles.page}>
      {/* ── DYNAMIC ANIMATION STYLES ── */}
      <style>{`
        .admin-btn-hover {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .admin-btn-hover:hover {
          transform: scale(1.08) translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(253, 38, 125, 0.35) !important;
        }
        .admin-btn-hover:active {
          transform: scale(0.96) !important;
        }

        .admin-filter-tab {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .admin-filter-tab:hover {
          transform: scale(1.06) translateY(-1px) !important;
          border-color: rgba(253, 38, 125, 0.5) !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .admin-filter-tab.active {
          background: linear-gradient(135deg, #fd267d, #ff6036) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 16px rgba(253, 38, 125, 0.45) !important;
          border-color: transparent !important;
          transform: scale(1.07) !important;
        }

        .admin-stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .admin-stat-card:hover {
          transform: translateY(-5px) scale(1.03) !important;
          box-shadow: 0 12px 24px -5px rgba(0, 0, 0, 0.4), 0 0 18px rgba(253, 38, 125, 0.2) !important;
          border-color: rgba(253, 38, 125, 0.35) !important;
        }
        .admin-tr {
          transition: background-color 0.15s ease;
        }
        .admin-tr:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      {/* ── TOP HEADER ── */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={{ fontSize: '1.6rem' }}>💝</span>
          <div>
            <div style={styles.brandName}>
              LoveYou <span style={styles.adminBadge}>Trang Quản Trị</span>
            </div>
            <div style={styles.brandSub}>Hệ Thống Quản Lý & Giám Sát Tài Khoản</div>
          </div>
        </div>

        <div style={styles.userInfo}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{
                fontSize: '0.72rem',
                background: 'linear-gradient(135deg, #FF0055, #FF5500)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '8px',
                fontWeight: 900,
              }}>👑 ADMIN</span>
              <span>{currentAdmin?.fullName || currentAdmin?.username || 'Quản trị viên'}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
              {currentAdmin?.email || (currentAdmin?.username ? `@${currentAdmin.username}` : '')}
            </div>
          </div>
          <button className="admin-btn-hover" style={styles.logoutBtn} onClick={logout}>Đăng xuất ➔</button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={styles.main}>
        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* KPI STATS CARDS */}
        {stats && (
          <div style={styles.statsGrid}>
            <div className="admin-stat-card" style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div>
                <div style={styles.statNumber}>{stats.totalUsers}</div>
                <div style={styles.statLabel}>Tổng số tài khoản</div>
              </div>
            </div>

            <div className="admin-stat-card" style={styles.statCard}>
              <div style={styles.statIcon}>👑</div>
              <div>
                <div style={{ ...styles.statNumber, color: '#f59e0b' }}>
                  {users.filter(u => u.isVip).length}
                </div>
                <div style={styles.statLabel}>Tài khoản VIP</div>
              </div>
            </div>

            <div className="admin-stat-card" style={styles.statCard}>
              <div style={styles.statIcon}>🟢</div>
              <div>
                <div style={{ ...styles.statNumber, color: '#10b981' }}>
                  {users.filter(u => getOnlineStatus(u).isOnline).length}
                </div>
                <div style={styles.statLabel}>Tài khoản online</div>
              </div>
            </div>

            <div className="admin-stat-card" style={styles.statCard}>
              <div style={styles.statIcon}>💖</div>
              <div>
                <div style={{ ...styles.statNumber, color: '#fd267d' }}>{stats.totalMatches}</div>
                <div style={styles.statLabel}>Lượt ghép đôi</div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION TABS NAV ── */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('USERS')}
            style={{
              padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', border: 'none', transition: 'all 0.25s ease',
              background: activeTab === 'USERS' ? 'linear-gradient(135deg, #fd267d, #ff6036)' : 'rgba(255,255,255,0.08)',
              color: '#fff', boxShadow: activeTab === 'USERS' ? '0 4px 15px rgba(253,38,125,0.4)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            Quản lý tài khoản
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            style={{
              padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', border: 'none', transition: 'all 0.25s ease',
              background: activeTab === 'REPORTS' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.08)',
              color: '#fff', boxShadow: activeTab === 'REPORTS' ? '0 4px 15px rgba(245,158,11,0.4)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            Báo cáo ({reports.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPORT')}
            style={{
              padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', border: 'none', transition: 'all 0.25s ease',
              background: activeTab === 'SUPPORT' ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.08)',
              color: '#fff', boxShadow: activeTab === 'SUPPORT' ? '0 4px 15px rgba(16,185,129,0.4)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            💬 Hỗ trợ người dùng ({supportConversations.filter(c => (c.adminUnreadCount || 0) > 0).length})
          </button>
          <button
            onClick={() => setActiveTab('AI_CONFIG')}
            style={{
              padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', border: 'none', transition: 'all 0.25s ease',
              background: activeTab === 'AI_CONFIG' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'rgba(255,255,255,0.08)',
              color: '#fff', boxShadow: activeTab === 'AI_CONFIG' ? '0 4px 15px rgba(139,92,246,0.4)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            🤖 Cấu hình AI
            {apiKeyInfo.hasKey
              ? <span style={{ background: 'rgba(52,211,153,0.3)', color: '#34d399', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem' }}>✓ Đã cài</span>
              : <span style={{ background: 'rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem' }}>! Chưa cài</span>
            }
          </button>
        </div>

        {/* USERS MANAGEMENT SECTION */}
        {activeTab === 'USERS' && (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Quản lý tài khoản</h2>
              <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
                Hiển thị <strong>{filteredUsers.length}</strong> / <strong>{users.length}</strong> người dùng
              </div>
            </div>

            {/* TOOLBAR: SEARCH & STATUS/ROLE FILTER */}
            <div style={{ ...styles.toolbar, flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ ...styles.searchBox, flex: 1, minWidth: '280px' }}>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên, Username hoặc Email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Role Filter Select */}
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
                    background: '#0f1115', color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">🛡️ Tất cả vai trò</option>
                  <option value="ADMIN">👑 ADMIN</option>
                  <option value="USER_VIP">👑 USER VIP</option>
                  <option value="USER_NORMAL">👤 USER THƯỜNG</option>
                </select>

                <div style={styles.filterGroup}>
                  {['ALL', 'ACTIVE', 'BANNED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`admin-filter-tab ${statusFilter === st ? 'active' : ''}`}
                      style={styles.filterBtn}
                    >
                      {st === 'ALL' ? 'Tất cả trạng thái' : st === 'ACTIVE' ? '🟢 Bình thường' : '🚫 Đã bị khóa'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* USERS TABLE */}
            {loading ? (
              <div style={styles.loadingBox}>⏳ Đang tải dữ liệu tài khoản từ cơ sở dữ liệu...</div>
            ) : (
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Người dùng</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Online</th>
                      <th style={styles.th}>Vai trò</th>
                      <th style={styles.th}>Trạng thái TK</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Thao tác quản trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={styles.emptyTd}>
                          Không tìm thấy tài khoản nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.userId} className="admin-tr" style={styles.tr}>
                          <td style={styles.td}>#{u.userId}</td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                alt=""
                                style={styles.tableAvatar}
                              />
                              <div>
                                <div style={{ fontWeight: '600', color: '#ffffff' }}>{u.fullName || u.username}</div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>{u.email}</td>
                          <td style={styles.td}>
                            {(() => {
                              const onlineInfo = getOnlineStatus(u);
                              return (
                                <span style={{
                                  padding: '3px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600,
                                  backgroundColor: onlineInfo.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                  color: onlineInfo.isOnline ? '#34d399' : 'rgba(255, 255, 255, 0.5)',
                                  border: onlineInfo.isOnline ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                }}>
                                  {onlineInfo.isOnline ? '🟢 Online' : `⚪ ${onlineInfo.text}`}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={styles.td}>
                            {u.role === 'ADMIN' ? (
                              <span style={{
                                padding: '5px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 900,
                                background: 'linear-gradient(135deg, #FF0055, #FF5500, #FFB700)', color: '#ffffff',
                                boxShadow: '0 3px 10px rgba(255, 0, 85, 0.45)', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                letterSpacing: '0.4px',
                              }}>
                                👑 ADMIN
                              </span>
                            ) : u.isVip ? (
                              <span style={{
                                padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                                background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                              }}>
                                ✨ USER VIP
                              </span>
                            ) : (
                              <span style={{
                                padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              }}>
                                👤 USER
                              </span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.statusBadge,
                              padding: '6px 12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600,
                              whiteSpace: 'nowrap', display: 'inline-block',
                              backgroundColor: u.status === 'BANNED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: u.status === 'BANNED' ? '#ef4444' : '#10b981',
                              border: u.status === 'BANNED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
                            }}>
                              {u.status === 'BANNED' ? 'Đã bị khóa' : 'Bình thường'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            {u.role !== 'ADMIN' && u.userId !== user?.userId ? (
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  className="admin-action-btn"
                                  style={{
                                    padding: '0.45rem 0.85rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                  }}
                                  onClick={() => handleOpenSupportWithUser(u)}
                                  title="Mở khung chat hỗ trợ với người dùng này"
                                >
                                  💬 Chat
                                </button>
                                <button
                                  className="admin-action-btn"
                                  style={styles.viewProfileBtn}
                                  onClick={() => setSelectedUser(u)}
                                >
                                  Chi tiết
                                </button>
                                <button
                                  className="admin-action-btn"
                                  disabled={actionLoading === u.userId}
                                  style={{
                                    ...styles.banToggleBtn,
                                    backgroundColor: u.status === 'BANNED' ? '#10b981' : '#ef4444',
                                  }}
                                  onClick={() => handleToggleBan(u)}
                                >
                                  {actionLoading === u.userId ? '...' : u.status === 'BANNED' ? 'Unban' : 'Ban'}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Tài khoản Admin</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* REPORTS MANAGEMENT SECTION */}
        {activeTab === 'REPORTS' && (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h2 style={{ ...styles.sectionTitle, color: '#F59E0B' }}>Danh sách báo cáo từ người dùng</h2>
              <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
                Tổng cộng <strong>{reports.length}</strong> báo cáo ({reports.filter(r => r.status === 'PENDING').length} chưa xử lý)
              </div>
            </div>

            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                Hiện chưa có sự kiện báo cáo vi phạm nào từ người dùng.
              </div>
            ) : (
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Thời gian</th>
                      <th style={styles.th}>Tài khoản báo cáo</th>
                      <th style={styles.th}>Nội dung báo cáo</th>
                      <th style={styles.th}>Tài khoản bị báo cáo</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(rep => {
                      const reporter = rep.reporter || {};
                      const reported = rep.reported || {};
                      const isPending = rep.status === 'PENDING';
                      return (
                        <tr key={rep.id} className="admin-tr" style={styles.tr}>
                          <td style={styles.td}>#{rep.id}</td>
                          <td style={{ ...styles.td, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                            {formatDate(rep.createdAt)}
                          </td>
                          <td style={styles.td}>
                            <div
                              onClick={() => reporter.userId && setSelectedUser(reporter)}
                              title="Click để xem chi tiết tài khoản báo cáo"
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                            >
                              <img
                                src={reporter.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                alt=""
                                style={{ ...styles.tableAvatar, border: '2px solid rgba(255,255,255,0.2)' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', textDecoration: 'underline' }}>{reporter.fullName || reporter.username || 'N/A'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{reporter.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{
                              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                              color: '#F59E0B', padding: '0.4rem 0.8rem', borderRadius: '8px',
                              fontSize: '0.85rem', fontWeight: 600, maxWidth: '240px', wordBreak: 'break-word'
                            }}>
                              {rep.reason}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div
                              onClick={() => reported.userId && setSelectedUser(reported)}
                              title="Click để xem chi tiết tài khoản bị báo cáo"
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                            >
                              <img
                                src={reported.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                alt=""
                                style={{ ...styles.tableAvatar, border: '2px solid rgba(255,255,255,0.2)' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', textDecoration: 'underline' }}>{reported.fullName || reported.username || 'N/A'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{reported.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            {isPending ? (
                              <button
                                onClick={() => setSelectedReport(rep)}
                                style={{
                                  padding: '6px 16px',
                                  borderRadius: '10px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                  color: '#ffffff',
                                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s',
                                }}
                              >
                                ⚠️ Xử lý
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedReport(rep)}
                                style={{
                                  padding: '5px 14px',
                                  borderRadius: '10px',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  color: '#34D399',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                title="Click để xem lại thông tin chi tiết báo cáo"
                              >
                                ✅ Đã xử lý
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* SUPPORT CHAT MANAGEMENT SECTION */}
        {activeTab === 'SUPPORT' && (
          <section style={{ ...styles.sectionCard, padding: '1.2rem' }}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', color: '#fff',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                }}>💬</div>
                <div>
                  <h2 style={{ ...styles.sectionTitle, color: '#34D399' }}>Trung tâm Hỗ trợ & Chăm sóc Khách hàng</h2>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                    Phản hồi trực tiếp các yêu cầu hỗ trợ, nạp VIP và giải đáp thắc mắc của người dùng
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '340px 1fr',
              gap: '16px',
              height: '560px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              padding: '12px',
              boxSizing: 'border-box',
              marginTop: '1rem',
            }}>
              {/* Left Column: List of conversations */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#13171F',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                {/* Search & New Chat Bar */}
                <div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Tìm theo tên hoặc email..."
                      value={supportSearch}
                      onChange={e => setSupportSearch(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        fontSize: '0.82rem',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => setShowNewChatSelector(!showNewChatSelector)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: showNewChatSelector ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      title="Bắt đầu nhắn tin với người dùng mới"
                    >
                      {showNewChatSelector ? '✕ Đóng' : '➕ Chat mới'}
                    </button>
                  </div>

                  {showNewChatSelector && (
                    <div style={{
                      marginTop: '4px',
                      padding: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
                        Chọn người dùng muốn nhắn tin:
                      </div>
                      <select
                        onChange={(e) => {
                          const u = users.find(usr => usr.userId === Number(e.target.value));
                          if (u) {
                            handleOpenSupportWithUser(u);
                            setShowNewChatSelector(false);
                          }
                        }}
                        defaultValue=""
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: '#1F2937',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      >
                        <option value="" disabled>-- Chọn người dùng ({users.filter(u => u.role !== 'ADMIN').length} user) --</option>
                        {users.filter(u => u.role !== 'ADMIN').map(u => (
                          <option key={u.userId} value={u.userId}>
                            {u.fullName || u.username} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Conversation List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    const filtered = supportConversations.filter(c => {
                      const q = supportSearch.toLowerCase();
                      if (!q) return true;
                      const u = c.user || {};
                      return (
                        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                        (u.username && u.username.toLowerCase().includes(q)) ||
                        (u.email && u.email.toLowerCase().includes(q))
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '30px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                          <p style={{ margin: '0 0 10px 0' }}>Chưa có cuộc trò chuyện hỗ trợ nào.</p>
                          <button
                            onClick={() => setShowNewChatSelector(true)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            ➕ Bắt đầu chat với người dùng
                          </button>
                        </div>
                      );
                    }

                    return filtered.map(conv => {
                      const u = conv.user || {};
                      const isSelected = selectedSupportConv?.id === conv.id;
                      const hasUnread = (conv.adminUnreadCount || 0) > 0;

                      return (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectSupportConversation(conv)}
                          style={{
                            padding: '12px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.18)' : hasUnread ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                            borderLeft: isSelected ? '4px solid #3b82f6' : hasUnread ? '4px solid #ef4444' : '4px solid transparent',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <img
                            src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                            alt=""
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: hasUnread ? 800 : 600, color: '#fff', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {u.fullName || u.username}
                              </div>
                              {hasUnread && (
                                <span style={{
                                  background: '#ef4444', color: '#fff', borderRadius: '10px',
                                  padding: '1px 6px', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0,
                                }}>
                                  {conv.adminUnreadCount}
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontSize: '0.76rem',
                              color: hasUnread ? '#FBBF24' : 'rgba(255,255,255,0.5)',
                              fontWeight: hasUnread ? 700 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '2px',
                            }}>
                              {conv.lastMessageText || 'Đã tạo phiên hỗ trợ'}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Column: Chat Console */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#13171F',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                {selectedSupportConv ? (
                  <>
                    {/* Active Chat Header */}
                    <div style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={selectedSupportConv.user?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt=""
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{selectedSupportConv.user?.fullName || selectedSupportConv.user?.username}</span>
                            {selectedSupportConv.user?.isVip && (
                              <span style={{ background: 'rgba(245,158,11,0.2)', color: '#FBBF24', fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px', borderRadius: '6px' }}>
                                👑 VIP
                              </span>
                            )}
                            {selectedSupportConv.user?.isCitizenVerified && (
                              <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px', borderRadius: '6px' }}>
                                ✓ CCCD
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            {selectedSupportConv.user?.email} • ID: #{selectedSupportConv.user?.userId}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedUser(selectedSupportConv.user)}
                        style={{
                          padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                          background: 'rgba(255,255,255,0.06)', fontSize: '0.78rem', fontWeight: 600, color: '#fff', cursor: 'pointer',
                        }}
                      >
                        Xem hồ sơ
                      </button>
                    </div>

                    {/* Message Stream */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#0D1016' }}>
                      {loadingSupportMessages ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                          Đang tải tin nhắn...
                        </div>
                      ) : supportMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                          Chưa có tin nhắn nào trong hội thoại này.
                        </div>
                      ) : (
                        supportMessages.map((msg, idx) => {
                          const isAdmin = msg.senderRole === 'ADMIN';
                          return (
                            <div
                              key={msg.id || idx}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isAdmin ? 'flex-end' : 'flex-start',
                              }}
                            >
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px', marginLeft: isAdmin ? 0 : '4px', marginRight: isAdmin ? '4px' : 0 }}>
                                {isAdmin ? `👑 ${msg.sender?.fullName || msg.sender?.username || 'Admin'}` : (selectedSupportConv.user?.fullName || selectedSupportConv.user?.username)} • {formatDate(msg.createdAt)}
                              </div>
                              <div
                                style={{
                                  maxWidth: '75%',
                                  padding: '9px 14px',
                                  borderRadius: '16px',
                                  fontSize: '0.86rem',
                                  lineHeight: 1.45,
                                  background: isAdmin ? 'linear-gradient(135deg, #10B981, #059669)' : '#1F2937',
                                  color: '#ffffff',
                                  border: isAdmin ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                                  borderBottomRightRadius: isAdmin ? '4px' : '16px',
                                  borderBottomLeftRadius: isAdmin ? '16px' : '4px',
                                }}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={supportChatEndRef} />
                    </div>

                    {/* Reply Input Bar */}
                    <form onSubmit={handleSendAdminReply} style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', backgroundColor: '#13171F' }}>
                      <input
                        type="text"
                        placeholder="Nhập nội dung phản hồi cho người dùng (nhấn Enter để gửi)..."
                        value={adminReplyText}
                        onChange={e => setAdminReplyText(e.target.value)}
                        disabled={sendingAdminReply}
                        style={{
                          flex: 1,
                          padding: '9px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#fff',
                          fontSize: '0.86rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sendingAdminReply || !adminReplyText.trim()}
                        style={{
                          padding: '0 18px',
                          borderRadius: '10px',
                          background: !adminReplyText.trim() || sendingAdminReply ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: !adminReplyText.trim() || sendingAdminReply ? 'default' : 'pointer',
                          whiteSpace: 'nowrap',
                          boxShadow: !adminReplyText.trim() || sendingAdminReply ? 'none' : '0 2px 10px rgba(16,185,129,0.3)',
                        }}
                      >
                        {sendingAdminReply ? 'Đang gửi...' : 'Phản hồi ➤'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', padding: '30px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>💬</div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1rem' }}>Chọn một cuộc hội thoại</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                      Chọn người dùng ở danh sách bên trái hoặc bấm ➕ Chat mới để gửi phản hồi hỗ trợ.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* AI CONFIG MANAGEMENT SECTION */}
        {activeTab === 'AI_CONFIG' && (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', color: '#fff',
                }}>🤖</div>
                <div>
                  <h2 style={{ ...styles.sectionTitle, color: '#ec4899' }}>Cấu hình Gemini AI Integration</h2>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                    Tự động sinh câu hỏi mini-game & phân tích mức độ ăn ý cho cặp đôi
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
              {/* Key Status Card */}
              <div style={{
                padding: '1.2rem', borderRadius: '14px', marginBottom: '1.5rem',
                background: apiKeyInfo.hasKey ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                border: apiKeyInfo.hasKey ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: apiKeyInfo.hasKey ? '#34d399' : '#f59e0b' }}>
                    {apiKeyInfo.hasKey ? '✅ Đã cài đặt Gemini API Key' : '⚠️ Chưa cài đặt API Key'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                    {apiKeyInfo.hasKey
                      ? `API Key hiện tại: ${apiKeyInfo.masked}`
                      : 'Hệ thống đang sử dụng bộ câu hỏi mặc định làm phương án thay thế'}
                  </div>
                </div>
                <span style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                  background: apiKeyInfo.hasKey ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                }}>
                  {apiKeyInfo.hasKey ? 'AI Active' : 'Fallback Mode'}
                </span>
              </div>

              {/* Input Form */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem',
              }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem', color: '#fff', marginBottom: '0.8rem' }}>
                  {apiKeyInfo.hasKey ? 'Cập nhật Gemini API Key mới:' : 'Nhập Gemini API Key:'}
                </label>
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="AQ... hoặc AIzaSy..."
                      value={newApiKey}
                      onChange={e => setNewApiKey(e.target.value)}
                      style={{
                        width: '100%', padding: '0.8rem 3rem 0.8rem 1rem',
                        borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)',
                        background: '#0f1115', color: '#fff',
                        fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(p => !p)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {showApiKey ? '👁️' : '🙈'}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={savingApiKey || !newApiKey.trim()}
                    style={{
                      padding: '0.8rem 2rem', borderRadius: '10px',
                      background: savingApiKey || !newApiKey.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      color: '#fff', fontWeight: 700, border: 'none',
                      cursor: savingApiKey || !newApiKey.trim() ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', fontSize: '0.92rem',
                      boxShadow: savingApiKey || !newApiKey.trim() ? 'none' : '0 4px 15px rgba(139,92,246,0.4)',
                    }}
                  >
                    {savingApiKey ? 'Đang lưu...' : 'Lưu Key'}
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                  🔒 <strong>Bảo mật:</strong> API Key được lưu bảo mật trong cơ sở dữ liệu backend (`SystemConfig`), chỉ Admin mới có quyền truy cập và thay đổi. Phía người dùng tuyệt đối không thể thấy key.
                </p>
              </div>

              {/* Guide Card */}
              <div style={{
                padding: '1.2rem 1.5rem', background: 'rgba(59,130,246,0.08)',
                borderRadius: '14px', border: '1px solid rgba(59,130,246,0.2)',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#60a5fa', marginBottom: '0.5rem' }}>
                  💡 Hướng dẫn lấy Gemini API Key miễn phí:
                </div>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                  <li>Truy cập trang <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#93c5fd', fontWeight: 700, textDecoration: 'underline' }}>Google AI Studio</a></li>
                  <li>Đăng nhập bằng tài khoản Google bất kỳ</li>
                  <li>Bấm nút <strong>Create API key</strong></li>
                  <li>Sao chép mã API key (bắt đầu bằng <code>AQ...</code> hoặc <code>AIzaSy...</code>) và dán vào ô bên trên để kích hoạt AI</li>
                </ol>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── PROFILE DETAIL MODAL ── */}
      {selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalBody} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Chi tiết hồ sơ tài khoản #{selectedUser.userId}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.profileHero}>
                <img
                  src={selectedUser.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                  alt=""
                  style={styles.profileAvatarLarge}
                />
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedUser.fullName || selectedUser.username}
                    {selectedUser.role === 'ADMIN' ? (
                      <span style={{
                        fontSize: '0.78rem', background: 'linear-gradient(135deg, #FF0055, #FF5500, #FFB700)',
                        color: '#fff', padding: '3px 10px', borderRadius: '10px', fontWeight: 900,
                        boxShadow: '0 2px 8px rgba(255,0,85,0.4)',
                      }}>👑 ADMIN</span>
                    ) : selectedUser.isVip ? (
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', fontWeight: 700,
                        background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.35)',
                      }}>✨ USER VIP</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>👤 USER</span>
                    )}
                  </h2>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px' }}>@{selectedUser.username} • {selectedUser.email}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={styles.tag}>{selectedUser.location || 'Chưa có vị trí'}</span>
                    <span style={styles.tag}>{selectedUser.height ? `${selectedUser.height} cm` : 'Chưa có chiều cao'}</span>
                    <span style={styles.tag}>{selectedUser.gender || 'Chưa xác định'}</span>
                  </div>
                </div>
              </div>

              <div style={styles.infoSection}>
                <div style={styles.infoLabel}>Tiểu sử:</div>
                <div style={styles.infoValue}>{selectedUser.bio || 'Chưa thêm tiểu sử giới thiệu'}</div>
              </div>

              <div style={styles.grid2Col}>
                <div><strong>Ngày tạo:</strong> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{formatDate(selectedUser.createdAt)}</span></div>
                <div><strong>Hoạt động gần nhất:</strong> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{formatDate(selectedUser.lastActiveAt)}</span></div>
                <div><strong>Số điện thoại:</strong> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{selectedUser.phoneNumber || 'Chưa đăng ký'}</span></div>
                <div><strong>Vai trò:</strong> <span style={{ color: 'rgba(255,255,255,0.85)' }}>{selectedUser.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : selectedUser.isVip ? 'Người dùng VIP (USER VIP)' : 'Người dùng (USER)'}</span></div>
                <div>
                  <strong>Trạng thái hiện tại:</strong><br />
                  {(() => {
                    const onlineInfo = getOnlineStatus(selectedUser);
                    return (
                      <span style={{
                        marginTop: '4px',
                        padding: '3px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                        backgroundColor: onlineInfo.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        color: onlineInfo.isOnline ? '#34d399' : 'rgba(255, 255, 255, 0.65)',
                        border: onlineInfo.isOnline ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}>
                        {onlineInfo.isOnline ? '🟢 Đang Online' : `⚪ Ngoại tuyến (${onlineInfo.text})`}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <strong>Xác thực Email (Gmail):</strong><br />
                  <span style={{
                    marginTop: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: selectedUser.isEmailVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: selectedUser.isEmailVerified ? '#34d399' : '#f87171',
                    border: selectedUser.isEmailVerified ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  }}>
                    {selectedUser.isEmailVerified ? '✓ Đã xác minh' : '✕ Chưa xác minh'}
                  </span>
                </div>
                <div>
                  <strong>Xác thực Căn cước (CCCD):</strong><br />
                  <span style={{
                    marginTop: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: selectedUser.isCitizenVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: selectedUser.isCitizenVerified ? '#34d399' : '#f87171',
                    border: selectedUser.isCitizenVerified ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  }}>
                    {selectedUser.isCitizenVerified ? '✓ Đã xác minh' : '✕ Chưa xác minh'}
                  </span>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <strong>Tình trạng tài khoản:</strong><br />
                  <span style={{
                    marginTop: '4px',
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: selectedUser.status === 'BANNED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: selectedUser.status === 'BANNED' ? '#ef4444' : '#10b981',
                    border: selectedUser.status === 'BANNED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                  }}>
                    {selectedUser.status === 'BANNED' ? '⛔ Đã bị khóa' : '✅ Bình thường'}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(16,185,129,0.35)',
                }}
                onClick={() => handleOpenSupportWithUser(selectedUser)}
              >
                💬 Nhắn tin hỗ trợ
              </button>
              {selectedUser.role !== 'ADMIN' && (
                <button
                  style={{
                    ...styles.banToggleBtn,
                    padding: '8px 16px', fontSize: '0.88rem',
                    backgroundColor: selectedUser.status === 'BANNED' ? '#10b981' : '#ef4444',
                  }}
                  onClick={() => handleToggleBan(selectedUser)}
                >
                  {selectedUser.status === 'BANNED' ? 'Mở khóa tài khoản này' : 'Khóa tài khoản này'}
                </button>
              )}
              <button style={styles.closeModalBtn} onClick={() => setSelectedUser(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT DETAIL & ACTION MODAL ── */}
      {selectedReport && (
        <div style={styles.modalOverlay} onClick={() => !reportActionLoading && setSelectedReport(null)}>
          <div style={{ ...styles.modalCard, maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚨</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
                  Chi tiết Báo cáo Vi phạm #{selectedReport.id}
                </h3>
              </div>
              <button
                style={styles.modalCloseBtn}
                onClick={() => !reportActionLoading && setSelectedReport(null)}
                disabled={reportActionLoading}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Meta Status Banner */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '10px',
                background: selectedReport.status === 'RESOLVED' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                border: selectedReport.status === 'RESOLVED' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Thời gian gửi: <strong style={{ color: '#fff' }}>{formatDate(selectedReport.createdAt)}</strong>
                </div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: selectedReport.status === 'RESOLVED' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                  color: selectedReport.status === 'RESOLVED' ? '#34D399' : '#F59E0B',
                }}>
                  {selectedReport.status === 'RESOLVED' ? '✅ ĐÃ XỬ LÝ' : '⚠️ CHỜ XỬ LÝ'}
                </span>
              </div>

              {/* Reported & Reporter Comparison Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {/* Reporter Card */}
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '8px' }}>
                    👤 Người Báo Cáo
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img
                      src={selectedReport.reporter?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                      alt=""
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedReport.reporter?.fullName || selectedReport.reporter?.username || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedReport.reporter?.email}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        ID: #{selectedReport.reporter?.userId}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => selectedReport.reporter?.userId && setSelectedUser(selectedReport.reporter)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Xem hồ sơ
                  </button>
                </div>

                {/* Reported Card */}
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🎯 Người Bị Báo Cáo</span>
                    {selectedReport.reported?.status === 'BANNED' && (
                      <span style={{ fontSize: '0.68rem', background: '#EF4444', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>ĐÃ BAN</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img
                      src={selectedReport.reported?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                      alt=""
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedReport.reported?.fullName || selectedReport.reported?.username || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedReport.reported?.email}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: selectedReport.reported?.status === 'BANNED' ? '#EF4444' : '#10B981', marginTop: '2px', fontWeight: 600 }}>
                        {selectedReport.reported?.status === 'BANNED' ? '⛔ Đã bị khóa' : '✅ Đang hoạt động'} • ID: #{selectedReport.reported?.userId}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => selectedReport.reported?.userId && setSelectedUser(selectedReport.reported)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Xem hồ sơ
                  </button>
                </div>
              </div>

              {/* Report Reason Content */}
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️ Nội dung / Lý do vi phạm</span>
                </div>
                <div style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  color: '#ffffff',
                  fontWeight: 500,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                }}>
                  {selectedReport.reason}
                </div>
              </div>

              {/* Report Resolution Info Box (Hướng đã giải quyết) */}
              <div style={{
                marginTop: '12px',
                padding: '14px',
                borderRadius: '12px',
                background: selectedReport.status === 'RESOLVED'
                  ? ((selectedReport.resolution === 'BAN_ACC' || selectedReport.reported?.status === 'BANNED')
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(59, 130, 246, 0.08)')
                  : 'rgba(255, 255, 255, 0.03)',
                border: selectedReport.status === 'RESOLVED'
                  ? ((selectedReport.resolution === 'BAN_ACC' || selectedReport.reported?.status === 'BANNED')
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid rgba(59, 130, 246, 0.3)')
                  : '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: selectedReport.status === 'RESOLVED'
                    ? ((selectedReport.resolution === 'BAN_ACC' || selectedReport.reported?.status === 'BANNED') ? '#F87171' : '#60A5FA')
                    : 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span>⚖️ Hướng đã giải quyết:</span>
                </div>
                <div>
                  {selectedReport.status === 'RESOLVED' ? (
                    (selectedReport.resolution === 'BAN_ACC' || selectedReport.reported?.status === 'BANNED') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '8px',
                          background: 'rgba(239,68,68,0.2)',
                          color: '#EF4444',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          border: '1px solid rgba(239,68,68,0.4)',
                        }}>
                          🚫 Ban acc (Khóa tài khoản)
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                          Đã xác định vi phạm và khóa tài khoản người dùng bị báo cáo.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '8px',
                          background: 'rgba(245,158,11,0.2)',
                          color: '#FBBF24',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          border: '1px solid rgba(245,158,11,0.4)',
                        }}>
                          ⏭️ Bỏ qua
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                          Báo cáo đã được xem xét và bỏ qua (không khóa tài khoản).
                        </span>
                      </div>
                    )
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                      Chưa xử lý — Vui lòng chọn hành động <strong>Ban acc</strong> hoặc <strong>Bỏ qua</strong> bên dưới để hoàn tất giải quyết báo cáo này.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              ...styles.modalFooter,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '16px 20px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {selectedReport.status === 'PENDING' ? (
                <>
                  {/* Option 1: Ban acc & Resolve */}
                  <button
                    disabled={reportActionLoading}
                    onClick={() => handleBanAccAndResolveReport(selectedReport)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: reportActionLoading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(239,68,68,0.35)',
                      opacity: reportActionLoading ? 0.6 : 1,
                    }}
                  >
                    🚫 Ban acc
                  </button>

                  {/* Option 2: Dismiss & Resolve */}
                  <button
                    disabled={reportActionLoading}
                    onClick={() => handleDismissAndResolveReport(selectedReport)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '10px',
                      border: '1px solid rgba(245,158,11,0.5)',
                      background: 'rgba(245,158,11,0.15)',
                      color: '#FBBF24',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: reportActionLoading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: reportActionLoading ? 0.6 : 1,
                    }}
                  >
                    ⏭️ Bỏ qua
                  </button>

                  {/* Option 3: Thoát (No changes) */}
                  <button
                    disabled={reportActionLoading}
                    onClick={() => setSelectedReport(null)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.85)',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    Thoát
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedReport(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', backgroundColor: '#0f1115', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff',
  },
  header: {
    backgroundColor: '#181c22', padding: '16px 32px', color: '#ffffff',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  brandName: {
    fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px',
  },
  adminBadge: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: '0.65rem', fontWeight: '900',
    padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase',
  },
  brandSub: {
    fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px',
  },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: '16px',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#ffffff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s',
  },
  main: {
    maxWidth: '1280px', margin: '0 auto', padding: '32px 24px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5', padding: '14px 20px', borderRadius: '12px',
    marginBottom: '24px', fontSize: '0.9rem', fontWeight: '500',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px', marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#181c22', border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '20px 24px', borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
    display: 'flex', alignItems: 'center', gap: '16px',
  },
  statIcon: {
    fontSize: '2rem', width: '48px', height: '48px', borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statNumber: {
    fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.1',
  },
  statLabel: {
    fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px', fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#181c22', border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px', padding: '24px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#ffffff',
  },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '16px', marginBottom: '20px',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#0f1115',
    border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 16px', width: '380px',
  },
  searchInput: {
    border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#ffffff',
  },
  filterGroup: {
    display: 'flex', gap: '8px',
  },
  filterBtn: {
    padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f1115', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: 'linear-gradient(135deg, #fd267d, #ff6036)', color: '#ffffff', borderColor: 'transparent',
  },
  loadingBox: {
    textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem',
  },
  tableResponsive: {
    overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem',
  },
  th: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  td: {
    padding: '14px 18px', verticalAlign: 'middle', color: 'rgba(255, 255, 255, 0.9)',
  },
  emptyTd: {
    textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem',
  },
  tableAvatar: {
    width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  roleBadge: {
    padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
  },
  statusBadge: {
    padding: '4px 12px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: '700',
  },
  viewProfileBtn: {
    padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontWeight: '600', fontSize: '0.8rem',
    cursor: 'pointer', transition: 'background 0.2s',
  },
  banToggleBtn: {
    padding: '6px 14px', borderRadius: '8px', border: 'none',
    color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px',
  },
  modalBody: {
    backgroundColor: '#181c22', border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px', width: '600px', maxWidth: '95vw',
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  modalCloseBtn: {
    border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
  },
  modalContent: {
    padding: '24px',
  },
  profileHero: {
    display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px',
  },
  profileAvatarLarge: {
    width: '100px', height: '100px', borderRadius: '20px', objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', padding: '4px 10px',
    borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)',
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  infoLabel: {
    fontWeight: '700', fontSize: '0.88rem', color: '#ffffff', marginBottom: '4px',
  },
  infoValue: {
    fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5',
  },
  grid2Col: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)',
  },
  modalFooter: {
    padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)',
    display: 'flex', justifyContent: 'flex-end', gap: '12px', borderRadius: '0 0 20px 20px',
  },
  closeModalBtn: {
    padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontWeight: '600', cursor: 'pointer',
  },
};
