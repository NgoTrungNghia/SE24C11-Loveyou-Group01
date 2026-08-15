import { useState, useEffect, useRef } from 'react';
import { adminApi, supportApi } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import ToastNotification from './ToastNotification';
import VerifiedBadge, { isFullyVerified } from './VerifiedBadge';

export default function AdminModal({ onClose }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' | 'REPORTS' | 'SUPPORT' | 'AI_CONFIG'
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Citizen Verification state
  const [verifications, setVerifications] = useState([]);
  const [verificationFilter, setVerificationFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [verificationSearch, setVerificationSearch] = useState('');
  const [verificationActionLoading, setVerificationActionLoading] = useState(null);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

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

  useEffect(() => {
    loadAdminData();
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

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, reportsRes, supportRes, apiKeyRes, verificationsRes] = await Promise.all([
        adminApi.stats(),
        adminApi.getUsers(),
        adminApi.getReports(),
        supportApi.getAdminConversations().catch(() => ({ data: { data: { conversations: [] } } })),
        adminApi.getApiKey().catch(() => ({ data: { data: { masked: null, hasKey: false } } })),
        adminApi.getCitizenVerifications().catch(() => ({ data: { data: { verifications: [] } } })),
      ]);
      setStats(statsRes.data.data.stats);
      setUsers(usersRes.data.data.users || []);
      setReports(reportsRes.data.data.reports || []);
      setSupportConversations(supportRes.data.data.conversations || []);
      setApiKeyInfo(apiKeyRes.data.data);
      setVerifications(verificationsRes.data?.data?.verifications || []);
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
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send_support_message', {
          conversationId: selectedSupportConv.id,
          content: text,
        });
      } else {
        const res = await supportApi.sendAdminMessage(selectedSupportConv.id, text);
        const newMsg = res.data.data.message;
        setSupportMessages(prev => [...prev, newMsg]);
        const updatedConv = res.data.data.conversation;
        setSupportConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
      }
      setTimeout(() => supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to send admin reply:', err);
      setToast({ type: 'error', message: 'Không thể gửi phản hồi' });
    } finally {
      setSendingAdminReply(false);
    }
  };

  const handleResolveReport = async (reportId, status = 'RESOLVED') => {
    try {
      const res = await adminApi.updateReportStatus(reportId, status);
      const updated = res.data.data.report;
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setToast({ type: 'success', message: 'Đã cập nhật trạng thái báo cáo thành công' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể cập nhật trạng thái báo cáo' });
    }
  };

  const handleToggleBan = async (userToToggle) => {
    const confirmText = userToToggle.status === 'BANNED'
      ? `Bạn có chắc muốn MỞ KHÓA tài khoản ${userToToggle.email}?`
      : `Bạn có chắc muốn KHÓA (BAN) tài khoản ${userToToggle.email}?`;

    if (!window.confirm(confirmText)) return;

    setActionLoading(userToToggle.userId);
    try {
      const res = await adminApi.toggleBan(userToToggle.userId);
      const updated = res.data.data.user;
      setUsers(prev => prev.map(u => u.userId === updated.userId ? { ...u, status: updated.status } : u));
      // Refresh stats
      const statsRes = await adminApi.stats();
      setStats(statsRes.data.data.stats);
      if (selectedUser?.userId === updated.userId) {
        setSelectedUser(prev => prev ? { ...prev, status: updated.status } : null);
      }
      setToast({ type: 'success', message: `Đã ${updated.status === 'BANNED' ? 'khóa' : 'mở khóa'} tài khoản ${userToToggle.email}` });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Thao tác thất bại' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );

    if (!matchesSearch) return false;

    if (roleFilter === 'ADMIN') return u.role === 'ADMIN';
    if (roleFilter === 'USER_VIP') return u.role === 'USER' && Boolean(u.isVip);
    if (roleFilter === 'USER_NORMAL') return u.role === 'USER' && !u.isVip;
    return true;
  });

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

  const handleApproveVerification = async (targetUserId) => {
    setVerificationActionLoading(targetUserId);
    try {
      await adminApi.approveCitizenVerification(targetUserId);
      setVerifications(prev => prev.map(v => v.userId === targetUserId ? {
        ...v,
        isCitizenVerified: true,
        citizenVerificationStatus: 'APPROVED',
        citizenRejectReason: null,
        citizenVerifiedAt: new Date().toISOString(),
      } : v));
      setUsers(prev => prev.map(u => u.userId === targetUserId ? {
        ...u,
        isCitizenVerified: true,
        citizenVerificationStatus: 'APPROVED',
        citizenRejectReason: null,
      } : u));
      setToast({ type: 'success', message: '✓ Đã phê duyệt xác thực Căn cước công dân thành công!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể duyệt hồ sơ' });
    } finally {
      setVerificationActionLoading(null);
    }
  };

  const handleOpenRejectModal = (userItem) => {
    setRejectingUser(userItem);
    setRejectReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    const reason = rejectReasonInput.trim() || 'Ảnh chụp CCCD không rõ ràng hoặc không hợp lệ';
    setVerificationActionLoading(rejectingUser.userId);
    try {
      await adminApi.rejectCitizenVerification(rejectingUser.userId, reason);
      setVerifications(prev => prev.map(v => v.userId === rejectingUser.userId ? {
        ...v,
        isCitizenVerified: false,
        citizenVerificationStatus: 'REJECTED',
        citizenRejectReason: reason,
      } : v));
      setUsers(prev => prev.map(u => u.userId === rejectingUser.userId ? {
        ...u,
        isCitizenVerified: false,
        citizenVerificationStatus: 'REJECTED',
        citizenRejectReason: reason,
      } : u));
      setToast({ type: 'success', message: 'Đã từ chối xác thực CCCD và gửi thông báo tới người dùng' });
      setRejectingUser(null);
      setRejectReasonInput('');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể từ chối hồ sơ' });
    } finally {
      setVerificationActionLoading(null);
    }
  };

  const getOnlineStatus = (u) => {
    if (!u) return { isOnline: false, text: 'Ngoại tuyến' };
    if (u?.isOnline || u?.userId === user?.userId) return { isOnline: true, text: 'Online' };
    if (!u?.lastActiveAt) return { isOnline: false, text: 'Chưa online' };
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
      return d.toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f2937' }}>Bảng quản trị hệ thống</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={styles.alert}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Đang tải dữ liệu hệ thống...
          </div>
        ) : (
          <div style={styles.content}>
            {/* Stats Cards */}
            {stats && (
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}>
                  <div style={styles.statNumber}>{stats.totalUsers}</div>
                  <div style={styles.statLabel}>Tổng tài khoản</div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ ...styles.statNumber, color: '#f59e0b' }}>
                    {users.filter(u => u.isVip).length}
                  </div>
                  <div style={styles.statLabel}>Tài khoản VIP</div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #10b981' }}>
                  <div style={{ ...styles.statNumber, color: '#10b981' }}>
                    {users.filter(u => getOnlineStatus(u).isOnline).length}
                  </div>
                  <div style={styles.statLabel}>Tài khoản online</div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #ec4899' }}>
                  <div style={{ ...styles.statNumber, color: '#ec4899' }}>{stats.totalMatches}</div>
                  <div style={styles.statLabel}>Lượt ghép đôi</div>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('USERS')}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                  background: activeTab === 'USERS' ? '#3b82f6' : '#e5e7eb',
                  color: activeTab === 'USERS' ? '#fff' : '#374151',
                }}
              >
                Quản lý tài khoản
              </button>
              <button
                onClick={() => setActiveTab('REPORTS')}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                  background: activeTab === 'REPORTS' ? '#f59e0b' : '#e5e7eb',
                  color: activeTab === 'REPORTS' ? '#fff' : '#374151',
                }}
              >
                Báo cáo ({reports.filter(r => r.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setActiveTab('SUPPORT')}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                  background: activeTab === 'SUPPORT' ? '#10b981' : '#e5e7eb',
                  color: activeTab === 'SUPPORT' ? '#fff' : '#374151',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                💬 Hỗ trợ người dùng ({supportConversations.filter(c => (c.adminUnreadCount || 0) > 0).length})
              </button>
              <button
                onClick={() => setActiveTab('VERIFICATION')}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                  background: activeTab === 'VERIFICATION' ? '#0284c7' : '#e5e7eb',
                  color: activeTab === 'VERIFICATION' ? '#fff' : '#374151',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                🛡️ Xác thực người dùng ({verifications.filter(v => v.citizenVerificationStatus === 'PENDING').length})
              </button>
              <button
                onClick={() => setActiveTab('AI_CONFIG')}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                  background: activeTab === 'AI_CONFIG' ? '#8b5cf6' : '#e5e7eb',
                  color: activeTab === 'AI_CONFIG' ? '#fff' : '#374151',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                🤖 Cấu hình AI
                {apiKeyInfo.hasKey
                  ? <span style={{ background: 'rgba(52,211,153,0.3)', color: '#34d399', borderRadius: '6px', padding: '1px 6px', fontSize: '0.7rem' }}>✓ Đã cài</span>
                  : <span style={{ background: 'rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '6px', padding: '1px 6px', fontSize: '0.7rem' }}>! Chưa cài</span>
                }
              </button>
            </div>

            {activeTab === 'USERS' && (
              <>
                {/* Search & Filter */}
                <div style={{ ...styles.searchBar, display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm theo Tên, Username hoặc Email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ ...styles.searchInput, flex: 1 }}
                  />
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    style={{
                      padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db',
                      background: '#fff', fontSize: '0.88rem', fontWeight: 600, color: '#374151', cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="ADMIN">👑 ADMIN</option>
                    <option value="USER_VIP">👑 USER VIP</option>
                    <option value="USER_NORMAL">👤 USER THƯỜNG</option>
                  </select>
                  <span style={{ fontSize: '0.88rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Hiển thị {filteredUsers.length} / {users.length} tài khoản
                  </span>
                </div>

                {/* Users Table */}
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Người dùng</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Online</th>
                        <th style={styles.th}>Vai trò</th>
                        <th style={styles.th}>Trạng thái TK</th>
                        <th style={styles.th}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                            Không tìm thấy tài khoản phù hợp
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.userId} style={styles.tr}>
                            <td style={styles.td}>#{u.userId}</td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                  alt=""
                                  style={styles.avatar}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{u.fullName || u.username}</span>
                                    {isFullyVerified(u) && <VerifiedBadge size={14} />}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>{u.email}</td>
                            <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                              {(() => {
                                const onlineInfo = getOnlineStatus(u);
                                return (
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: onlineInfo.isOnline ? '#d1fae5' : '#f3f4f6',
                                    color: onlineInfo.isOnline ? '#065f46' : '#6b7280',
                                  }}>
                                    <span style={{ fontSize: '0.65rem' }}>{onlineInfo.isOnline ? '🟢' : '⚪'}</span>
                                    <span>{onlineInfo.isOnline ? 'Online' : onlineInfo.text}</span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={styles.td}>
                              {u.role === 'ADMIN' ? (
                                <span style={{
                                  padding: '5px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 900,
                                  background: 'linear-gradient(135deg, #FF0055, #FF5500, #FFB700)', color: '#fff',
                                  boxShadow: '0 2px 8px rgba(255, 0, 85, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  letterSpacing: '0.4px',
                                }}>
                                  👑 ADMIN
                                </span>
                              ) : u.isVip ? (
                                <span style={{
                                  padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                                  background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                }}>
                                  ✨ USER VIP
                                </span>
                              ) : (
                                <span style={{
                                  padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                                  background: '#f3f4f6', color: '#4b5563', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                }}>
                                  👤 USER
                                </span>
                              )}
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '5px 12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '600',
                                whiteSpace: 'nowrap', display: 'inline-block',
                                backgroundColor: u.status === 'BANNED' ? '#fee2e2' : '#d1fae5',
                                color: u.status === 'BANNED' ? '#991b1b' : '#065f46'
                              }}>
                                {u.status === 'BANNED' ? 'Đã bị khóa' : 'Bình thường'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  onClick={() => handleOpenSupportWithUser(u)}
                                  title="Mở khung chat hỗ trợ với người dùng này"
                                >
                                  💬 Chat
                                </button>
                                <button
                                  style={styles.viewBtn}
                                  onClick={() => setSelectedUser(u)}
                                  title="Xem hồ sơ chi tiết"
                                >
                                  Hồ sơ
                                </button>
                                {u.role !== 'ADMIN' && (
                                  <button
                                    style={{
                                      ...styles.banBtn,
                                      backgroundColor: u.status === 'BANNED' ? '#10b981' : '#ef4444',
                                    }}
                                    disabled={actionLoading === u.userId}
                                    onClick={() => handleToggleBan(u)}
                                  >
                                    {actionLoading === u.userId ? '...' : u.status === 'BANNED' ? 'Unban' : 'Ban'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Reports Section */}
            {activeTab === 'REPORTS' && (
              <div style={styles.tableWrapper}>
                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Hiện chưa có sự kiện báo cáo vi phạm nào từ người dùng.
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Thời gian</th>
                        <th style={styles.th}>Tài khoản báo cáo</th>
                        <th style={styles.th}>Nội dung báo cáo</th>
                        <th style={styles.th}>Tài khoản bị báo cáo</th>
                        <th style={styles.th}>Trạng thái</th>
                        <th style={styles.th}>Thao tác Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(rep => {
                        const reporter = rep.reporter || {};
                        const reported = rep.reported || {};
                        const isReportedBanned = reported.status === 'BANNED';
                        return (
                          <tr key={rep.id} style={styles.tr}>
                            <td style={styles.td}>#{rep.id}</td>
                            <td style={{ ...styles.td, fontSize: '0.8rem', color: '#6b7280' }}>
                              {formatDate(rep.createdAt)}
                            </td>
                            <td style={styles.td}>
                              <div
                                onClick={() => reporter.userId && setSelectedUser(reporter)}
                                title="Click để xem chi tiết tài khoản báo cáo"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <img
                                  src={reporter.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                  alt=""
                                  style={{ ...styles.avatar, border: '2px solid #3b82f6' }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem', textDecoration: 'underline' }}>{reporter.fullName || reporter.username || 'N/A'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{reporter.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                background: '#fef3c7', color: '#b45309', padding: '4px 8px',
                                borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, display: 'inline-block'
                              }}>
                                {rep.reason}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div
                                onClick={() => reported.userId && setSelectedUser(reported)}
                                title="Click để xem chi tiết tài khoản bị báo cáo"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <img
                                  src={reported.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                  alt=""
                                  style={{ ...styles.avatar, border: '2px solid #ef4444' }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem', textDecoration: 'underline' }}>{reported.fullName || reported.username || 'N/A'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{reported.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '5px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600',
                                whiteSpace: 'nowrap', display: 'inline-block',
                                backgroundColor: rep.status === 'RESOLVED' ? '#d1fae5' : '#fef3c7',
                                color: rep.status === 'RESOLVED' ? '#065f46' : '#b45309'
                              }}>
                                {rep.status === 'RESOLVED' ? 'Đã xử lý' : 'Chờ xử lý'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {reported.userId && (
                                  <button
                                    style={{
                                      ...styles.banBtn,
                                      backgroundColor: isReportedBanned ? '#10b981' : '#ef4444',
                                      padding: '5px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap'
                                    }}
                                    disabled={actionLoading === reported.userId}
                                    onClick={() => handleToggleBan(reported)}
                                  >
                                    {isReportedBanned ? 'Unban' : 'Ban'}
                                  </button>
                                )}
                                {rep.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                                    style={{
                                      background: '#10b981', color: '#fff', border: 'none',
                                      borderRadius: '6px', padding: '5px 10px', fontSize: '0.8rem',
                                      fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                    }}
                                  >
                                    Xử lý
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Support Chat Tab */}
            {activeTab === 'SUPPORT' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                gap: '16px',
                height: '540px',
                background: '#f9fafb',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                padding: '12px',
                boxSizing: 'border-box',
              }}>
                {/* Left Column: List of conversations */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}>
                  {/* Search and New Chat button */}
                  <div style={{ padding: '10px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '6px', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="🔍 Tìm theo tên/email..."
                        value={supportSearch}
                        onChange={e => setSupportSearch(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.82rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        onClick={() => setShowNewChatSelector(!showNewChatSelector)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: showNewChatSelector ? '#e5e7eb' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: showNewChatSelector ? '#374151' : '#fff',
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
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Chọn tài khoản muốn nhắn tin:
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
                            border: '1px solid #d1d5db',
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
                          <div style={{ padding: '30px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
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
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#eff6ff' : hasUnread ? '#fffbeb' : '#fff',
                              borderLeft: isSelected ? '4px solid #3b82f6' : hasUnread ? '4px solid #ef4444' : '4px solid transparent',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'center',
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = hasUnread ? '#fffbeb' : '#fff'; }}
                          >
                            <img
                              src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                              alt=""
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: hasUnread ? 800 : 600, color: '#111827', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                                color: hasUnread ? '#b45309' : '#6b7280',
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
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}>
                  {selectedSupportConv ? (
                    <>
                      {/* Active Chat Header */}
                      <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={selectedSupportConv.user?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{selectedSupportConv.user?.fullName || selectedSupportConv.user?.username}</span>
                              {isFullyVerified(selectedSupportConv.user) && (
                                <VerifiedBadge size={15} />
                              )}
                              {selectedSupportConv.user?.isVip && (
                                <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px', borderRadius: '6px' }}>
                                  👑 VIP
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {selectedSupportConv.user?.email} • ID: #{selectedSupportConv.user?.userId}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedUser(selectedSupportConv.user)}
                          style={{
                            padding: '4px 10px', borderRadius: '8px', border: '1px solid #d1d5db',
                            background: '#fff', fontSize: '0.75rem', fontWeight: 600, color: '#374151', cursor: 'pointer',
                          }}
                        >
                          Xem hồ sơ
                        </button>
                      </div>

                      {/* Message Stream */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb' }}>
                        {loadingSupportMessages ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '0.85rem' }}>
                            Đang tải tin nhắn...
                          </div>
                        ) : supportMessages.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '0.85rem' }}>
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
                                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '3px', marginLeft: isAdmin ? 0 : '4px', marginRight: isAdmin ? '4px' : 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 600, color: isAdmin ? '#2563eb' : '#111827' }}>
                                    {isAdmin ? `👑 ${msg.sender?.fullName || msg.sender?.username || 'Admin'}` : (selectedSupportConv.user?.fullName || selectedSupportConv.user?.username)}
                                  </span>
                                  <span>•</span>
                                  <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{formatDate(msg.createdAt)}</span>
                                </div>
                                <div
                                  style={{
                                    maxWidth: '75%',
                                    padding: '8px 14px',
                                    borderRadius: '16px',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.45,
                                    backgroundColor: isAdmin ? '#3b82f6' : '#ffffff',
                                    color: isAdmin ? '#ffffff' : '#111827',
                                    border: isAdmin ? 'none' : '1px solid #e5e7eb',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    borderBottomRightRadius: isAdmin ? '4px' : '16px',
                                    borderBottomLeftRadius: isAdmin ? '16px' : '4px',
                                  }}
                                >
                                  <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={supportChatEndRef} />
                      </div>

                      {/* Reply Input Bar */}
                      <form onSubmit={handleSendAdminReply} style={{ padding: '10px 14px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', backgroundColor: '#fff' }}>
                        <input
                          type="text"
                          placeholder="Nhập nội dung phản hồi cho người dùng (nhấn Enter để gửi)..."
                          value={adminReplyText}
                          onChange={e => setAdminReplyText(e.target.value)}
                          disabled={sendingAdminReply}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={sendingAdminReply || !adminReplyText.trim()}
                          style={{
                            padding: '0 18px',
                            borderRadius: '10px',
                            background: !adminReplyText.trim() || sendingAdminReply ? '#9ca3af' : '#10b981',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: !adminReplyText.trim() || sendingAdminReply ? 'default' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {sendingAdminReply ? 'Đang gửi...' : 'Phản hồi ➤'}
                        </button>
                      </form>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', padding: '30px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '8px' }}>💬</div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#374151', fontSize: '1rem' }}>Chọn một cuộc hội thoại</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
                        Chọn người dùng ở danh sách bên trái để xem tin nhắn và gửi phản hồi hỗ trợ.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CITIZEN VERIFICATION MANAGEMENT SECTION */}
            {activeTab === 'VERIFICATION' && (
              <div style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🛡️</span>
                      <span>Xác thực người dùng (Căn cước công dân)</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
                      Xem ảnh 2 mặt CCCD và phê duyệt hoặc từ chối yêu cầu xác thực
                    </p>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    Tổng số yêu cầu: <strong>{verifications.length}</strong>
                  </div>
                </div>

                {/* Filter Tabs & Search */}
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Tìm theo Tên, Username hoặc Email..."
                    value={verificationSearch}
                    onChange={e => setVerificationSearch(e.target.value)}
                    style={{ ...styles.searchInput, width: '280px', padding: '8px 12px' }}
                  />

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { key: 'ALL', label: 'Tất cả', count: verifications.length },
                      { key: 'PENDING', label: '⏳ Chờ duyệt', count: verifications.filter(v => v.citizenVerificationStatus === 'PENDING').length },
                      { key: 'APPROVED', label: '✅ Đã duyệt', count: verifications.filter(v => v.isCitizenVerified || v.citizenVerificationStatus === 'APPROVED').length },
                      { key: 'REJECTED', label: '❌ Bị từ chối', count: verifications.filter(v => v.citizenVerificationStatus === 'REJECTED').length },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setVerificationFilter(tab.key)}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                          cursor: 'pointer', border: '1px solid',
                          borderColor: verificationFilter === tab.key ? '#0284c7' : '#d1d5db',
                          background: verificationFilter === tab.key ? '#e0f2fe' : '#fff',
                          color: verificationFilter === tab.key ? '#0369a1' : '#4b5563',
                        }}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items List */}
                {(() => {
                  const filtered = verifications.filter(v => {
                    if (verificationFilter === 'PENDING' && v.citizenVerificationStatus !== 'PENDING') return false;
                    if (verificationFilter === 'APPROVED' && !v.isCitizenVerified && v.citizenVerificationStatus !== 'APPROVED') return false;
                    if (verificationFilter === 'REJECTED' && v.citizenVerificationStatus !== 'REJECTED') return false;
                    if (verificationSearch.trim()) {
                      const q = verificationSearch.toLowerCase().trim();
                      const nameMatch = (v.fullName || '').toLowerCase().includes(q);
                      const userMatch = (v.username || '').toLowerCase().includes(q);
                      const emailMatch = (v.email || '').toLowerCase().includes(q);
                      if (!nameMatch && !userMatch && !emailMatch) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>📭</div>
                        <div style={{ fontWeight: 600, color: '#374151' }}>Không có yêu cầu xác thực nào</div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {filtered.map(item => {
                        const isPending = item.citizenVerificationStatus === 'PENDING';
                        const isApproved = item.isCitizenVerified || item.citizenVerificationStatus === 'APPROVED';
                        const isRejected = item.citizenVerificationStatus === 'REJECTED';

                        return (
                          <div
                            key={item.userId}
                            style={{
                              background: isPending ? '#fffbeb' : '#fff',
                              border: isPending ? '1px solid #fde68a' : isApproved ? '1px solid #a7f3d0' : '1px solid #fecaca',
                              borderRadius: '14px',
                              padding: '1.2rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.9rem',
                            }}
                          >
                            {/* Top info */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={item.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                  alt=""
                                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                                    {item.fullName || item.username} <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>@{item.username}</span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                    📧 {item.email} • 📅 Cập nhật: {formatDate(item.updatedAt)}
                                  </div>
                                </div>
                              </div>

                              <div>
                                {isApproved ? (
                                  <span style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                                    ✓ Đã duyệt
                                  </span>
                                ) : isRejected ? (
                                  <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                                    ✕ Bị từ chối
                                  </span>
                                ) : (
                                  <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                                    ⏳ Chờ Admin duyệt
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Photos */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                              {/* Front */}
                              <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '0.6rem', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Mặt trước CCCD</span>
                                  {item.citizenFrontPhoto && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage(item.citizenFrontPhoto)}
                                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                      🔍 Phóng to
                                    </button>
                                  )}
                                </div>
                                {item.citizenFrontPhoto ? (
                                  <div
                                    onClick={() => setPreviewImage(item.citizenFrontPhoto)}
                                    style={{ height: '130px', background: '#e5e7eb', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
                                  >
                                    <img src={item.citizenFrontPhoto} alt="Mặt trước" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  </div>
                                ) : (
                                  <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>Chưa có ảnh</div>
                                )}
                              </div>

                              {/* Back */}
                              <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '0.6rem', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Mặt sau CCCD</span>
                                  {item.citizenBackPhoto && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage(item.citizenBackPhoto)}
                                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                      🔍 Phóng to
                                    </button>
                                  )}
                                </div>
                                {item.citizenBackPhoto ? (
                                  <div
                                    onClick={() => setPreviewImage(item.citizenBackPhoto)}
                                    style={{ height: '130px', background: '#e5e7eb', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
                                  >
                                    <img src={item.citizenBackPhoto} alt="Mặt sau" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  </div>
                                ) : (
                                  <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>Chưa có ảnh</div>
                                )}
                              </div>
                            </div>

                            {/* Reject reason note */}
                            {isRejected && (
                              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', color: '#991b1b' }}>
                                <strong>Lý do từ chối:</strong> {item.citizenRejectReason || 'Ảnh chụp không rõ ràng hoặc không hợp lệ'}
                              </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid #f3f4f6' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(item)}
                                disabled={verificationActionLoading === item.userId}
                                style={{
                                  padding: '6px 14px', borderRadius: '8px',
                                  background: '#fee2e2', border: '1px solid #fecaca',
                                  color: '#991b1b', fontWeight: 700, fontSize: '0.82rem',
                                  cursor: 'pointer',
                                }}
                              >
                                ❌ Từ chối
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApproveVerification(item.userId)}
                                disabled={verificationActionLoading === item.userId || isApproved}
                                style={{
                                  padding: '6px 16px', borderRadius: '8px',
                                  background: isApproved ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                                  border: 'none', color: '#fff',
                                  fontWeight: 700, fontSize: '0.82rem',
                                  cursor: (verificationActionLoading === item.userId || isApproved) ? 'default' : 'pointer',
                                }}
                              >
                                {verificationActionLoading === item.userId ? 'Đang xử lý...' : isApproved ? '✓ Đã duyệt' : '✅ Phê duyệt'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'AI_CONFIG' && (
              <div style={{ padding: '1rem 0' }}>
                <div style={{
                  background: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb',
                  padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', color: '#fff',
                    }}>🤖</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Gemini AI Integration</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
                        Tự động sinh câu hỏi mini-game & phân tích mức độ ăn ý cho cặp đôi
                      </p>
                    </div>
                  </div>

                  {/* Key Status */}
                  <div style={{
                    padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem',
                    background: apiKeyInfo.hasKey ? '#ecfdf5' : '#fffbe0',
                    border: apiKeyInfo.hasKey ? '1px solid #a7f3d0' : '1px solid #fde68a',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: apiKeyInfo.hasKey ? '#065f46' : '#92400e' }}>
                        {apiKeyInfo.hasKey ? '✅ Đã cài đặt Gemini API Key' : '⚠️ Chưa cài đặt API Key'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: apiKeyInfo.hasKey ? '#047857' : '#b45309', marginTop: '2px' }}>
                        {apiKeyInfo.hasKey
                          ? `API Key hiện tại: ${apiKeyInfo.masked}`
                          : 'Hệ thống đang sử dụng bộ câu hỏi mặc định làm phương án thay thế'}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                      background: apiKeyInfo.hasKey ? '#10b981' : '#f59e0b', color: '#fff',
                    }}>
                      {apiKeyInfo.hasKey ? 'AI Active' : 'Fallback Mode'}
                    </span>
                  </div>

                  {/* Input Form */}
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '1.2rem', border: '1px solid #e5e7eb' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#374151', marginBottom: '0.5rem' }}>
                      {apiKeyInfo.hasKey ? 'Cập nhật Gemini API Key mới:' : 'Nhập Gemini API Key:'}
                    </label>
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="AQ... hoặc AIzaSy..."
                          value={newApiKey}
                          onChange={e => setNewApiKey(e.target.value)}
                          style={{
                            width: '100%', padding: '0.7rem 2.5rem 0.7rem 0.9rem',
                            borderRadius: '10px', border: '1px solid #d1d5db',
                            fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(p => !p)}
                          style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#6b7280',
                          }}
                        >
                          {showApiKey ? '👁️' : '🙈'}
                        </button>
                      </div>
                      <button
                        onClick={handleSaveApiKey}
                        disabled={savingApiKey || !newApiKey.trim()}
                        style={{
                          padding: '0.7rem 1.5rem', borderRadius: '10px',
                          background: savingApiKey || !newApiKey.trim() ? '#9ca3af' : '#8b5cf6',
                          color: '#fff', fontWeight: 700, border: 'none', cursor: savingApiKey || !newApiKey.trim() ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap', fontSize: '0.9rem',
                        }}
                      >
                        {savingApiKey ? 'Đang lưu...' : 'Lưu Key'}
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', lineHeight: '1.4' }}>
                      🔒 <strong>Bảo mật:</strong> API Key được mã hóa và lưu trực tiếp trong DB backend (`SystemConfig`), chỉ Admin có quyền truy cập. Phía Client/User hoàn toàn không nhìn thấy key.
                    </p>
                  </div>

                  <div style={{ marginTop: '1.2rem', padding: '1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.3rem' }}>
                      💡 Hướng dẫn lấy Gemini API Key miễn phí:
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                      <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Google AI Studio</a></li>
                      <li>Đăng nhập bằng tài khoản Google</li>
                      <li>Bấm nút <strong>Create API key</strong> và chọn một dự án</li>
                      <li>Copy API key bắt đầu bằng <code>AQ...</code> hoặc <code>AIzaSy...</code> và dán vào ô bên trên</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Detail Modal */}
        {selectedUser && (
          <div style={styles.nestedBackdrop} onClick={() => setSelectedUser(null)}>
            <div style={styles.nestedModal} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#111827' }}>Chi tiết hồ sơ tài khoản #{selectedUser.userId}</h3>
                <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <img
                  src={selectedUser.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                  alt=""
                  style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', border: '3px solid #e5e7eb' }}
                />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{selectedUser.fullName || selectedUser.username}</span>
                    {isFullyVerified(selectedUser) && (
                      <VerifiedBadge size={17} />
                    )}
                    {selectedUser.role === 'ADMIN' ? (
                      <span style={{
                        fontSize: '0.78rem', background: 'linear-gradient(135deg, #FF0055, #FF5500, #FFB700)',
                        color: '#fff', padding: '3px 10px', borderRadius: '10px', fontWeight: 900,
                        boxShadow: '0 2px 8px rgba(255, 0, 85, 0.4)',
                      }}>
                        👑 ADMIN
                      </span>
                    ) : selectedUser.isVip ? (
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', fontWeight: 700,
                        background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a',
                      }}>
                        ✨ USER VIP
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', background: '#e5e7eb', color: '#4b5563', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        👤 USER
                      </span>
                    )}
                  </h2>
                  <div style={{ color: '#4b5563', marginBottom: '8px' }}>@{selectedUser.username} • {selectedUser.email}</div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                    <span>{selectedUser.location || 'Chưa có vị trí'}</span>
                    <span>{selectedUser.height ? `${selectedUser.height} cm` : 'Chưa có chiều cao'}</span>
                    <span>{selectedUser.gender || 'Chưa xác định'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', background: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Tiểu sử:</div>
                <div style={{ color: '#4b5563', fontSize: '0.92rem' }}>{selectedUser.bio || 'Chưa có tiểu sử'}</div>
              </div>

              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                <div><strong>Ngày tạo:</strong> {formatDate(selectedUser.createdAt)}</div>
                <div><strong>Hoạt động gần nhất:</strong> {formatDate(selectedUser.lastActiveAt)}</div>
                <div><strong>Số điện thoại:</strong> {selectedUser.phoneNumber || 'Chưa đăng ký'}</div>
                <div><strong>Vai trò:</strong> {selectedUser.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : selectedUser.isVip ? 'Người dùng VIP' : 'Người dùng'}</div>
                <div>
                  <strong>Trạng thái hiện tại:</strong><br />
                  {(() => {
                    const onlineInfo = getOnlineStatus(selectedUser);
                    return (
                      <span style={{
                        marginTop: '4px',
                        padding: '3px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                        backgroundColor: onlineInfo.isOnline ? '#d1fae5' : '#f3f4f6',
                        color: onlineInfo.isOnline ? '#065f46' : '#6b7280',
                        border: onlineInfo.isOnline ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}>
                        {onlineInfo.isOnline ? '🟢 Đang Online' : `⚪ Ngoại tuyến (${onlineInfo.text})`}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <strong>Hồ sơ xác thực:</strong><br />
                  <span style={{
                    marginTop: '4px',
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: (selectedUser.isEmailVerified && selectedUser.isCitizenVerified) ? '#d1fae5' : '#fef3c7',
                    color: (selectedUser.isEmailVerified && selectedUser.isCitizenVerified) ? '#065f46' : '#b45309',
                    border: (selectedUser.isEmailVerified && selectedUser.isCitizenVerified) ? '1px solid #a7f3d0' : '1px solid #fde68a',
                  }}>
                    {(selectedUser.isEmailVerified && selectedUser.isCitizenVerified) ? '✅ Đã xác thực' : '⚠️ Chưa xác thực'}
                  </span>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <strong>Tình trạng tài khoản:</strong><br />
                  <span style={{
                    marginTop: '4px',
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: selectedUser.status === 'BANNED' ? '#fee2e2' : '#d1fae5',
                    color: selectedUser.status === 'BANNED' ? '#991b1b' : '#065f46',
                    border: selectedUser.status === 'BANNED' ? '1px solid #fecaca' : '1px solid #a7f3d0',
                  }}>
                    {selectedUser.status === 'BANNED' ? '⛔ Đã bị khóa' : '✅ Bình thường'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={() => handleOpenSupportWithUser(selectedUser)}
                >
                  💬 Nhắn tin hỗ trợ
                </button>
                {selectedUser.role !== 'ADMIN' && (
                  <button
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer',
                      backgroundColor: selectedUser.status === 'BANNED' ? '#10b981' : '#ef4444',
                    }}
                    onClick={() => handleToggleBan(selectedUser)}
                  >
                    {selectedUser.status === 'BANNED' ? 'Mở khóa tài khoản này' : 'Khóa tài khoản này'}
                  </button>
                )}
                <button
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                  onClick={() => setSelectedUser(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── IMAGE LIGHTBOX PREVIEW MODAL ── */}
        {previewImage && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 10002, padding: '20px',
            }}
            onClick={() => setPreviewImage(null)}
          >
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="CCCD Preview"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
              />
              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  marginTop: '15px', padding: '8px 24px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                ✕ Đóng ảnh
              </button>
            </div>
          </div>
        )}

        {/* ── REJECT CCCD REASON MODAL ── */}
        {rejectingUser && (
          <div style={styles.nestedBackdrop} onClick={() => setRejectingUser(null)}>
            <div style={{ ...styles.nestedModal, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>❌</span>
                  <span>Từ chối CCCD: {rejectingUser.fullName || rejectingUser.username}</span>
                </h3>
                <button style={styles.closeBtn} onClick={() => setRejectingUser(null)}>✕</button>
              </div>

              <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.45 }}>
                Vui lòng chọn hoặc nhập lý do từ chối để thông báo tới người dùng:
              </p>

              {/* Quick Preset Reasons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {[
                  'Ảnh chụp bị mờ / không đọc được chữ',
                  'Ảnh bị lóa sáng / phản chiếu ánh sáng',
                  'Không đúng ảnh Căn cước công dân',
                  'Ảnh bị cắt góc / che khuất thông tin',
                  'Ảnh mặt trước và mặt sau không khớp',
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReasonInput(preset)}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem',
                      background: rejectReasonInput === preset ? '#fee2e2' : '#f3f4f6',
                      border: '1px solid',
                      borderColor: rejectReasonInput === preset ? '#f87171' : '#e5e7eb',
                      color: rejectReasonInput === preset ? '#991b1b' : '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={e => setRejectReasonInput(e.target.value)}
                placeholder="Nhập lý do từ chối cụ thể..."
                style={{
                  width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db',
                  borderRadius: '8px', padding: '8px 10px', fontSize: '0.85rem', outline: 'none',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                  onClick={() => setRejectingUser(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={verificationActionLoading === rejectingUser.userId}
                  style={{
                    padding: '6px 16px', borderRadius: '6px', border: 'none',
                    background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  {verificationActionLoading === rejectingUser.userId ? 'Đang gửi...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px',
  },
  container: {
    backgroundColor: '#ffffff', borderRadius: '20px',
    width: '1000px', maxWidth: '95vw', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  header: {
    padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.2rem',
    cursor: 'pointer', color: '#6b7280', padding: '4px 8px', borderRadius: '6px',
  },
  content: {
    padding: '24px', overflowY: 'auto', flex: 1,
  },
  alert: {
    margin: '16px 24px 0 24px', padding: '12px 16px', background: '#fee2e2',
    color: '#991b1b', borderRadius: '8px', fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px', marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#f9fafb', padding: '16px 20px', borderRadius: '12px',
  },
  statNumber: {
    fontSize: '1.8rem', fontWeight: '700', color: '#1f2937', lineHeight: '1.2',
  },
  statLabel: {
    fontSize: '0.85rem', color: '#6b7280', marginTop: '4px',
  },
  searchBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', gap: '16px',
  },
  searchInput: {
    padding: '10px 16px', borderRadius: '10px', border: '1px solid #d1d5db',
    width: '360px', fontSize: '0.9rem', outline: 'none',
  },
  tableWrapper: {
    border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left',
  },
  th: {
    backgroundColor: '#f9fafb', padding: '12px 16px', fontWeight: '600',
    color: '#4b5563', borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s',
  },
  td: {
    padding: '12px 16px', verticalAlign: 'middle',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover',
  },
  viewBtn: {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
    background: '#ffffff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
  },
  banBtn: {
    padding: '6px 12px', borderRadius: '6px', border: 'none',
    color: '#ffffff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
  },
  nestedBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  nestedModal: {
    backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px',
    width: '560px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
};
