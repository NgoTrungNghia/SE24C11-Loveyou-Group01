import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, userApi, matchingApi, aiMatchingApi, chatApi, paymentApi } from '../utils/api';
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket';
import ChatPanel from '../components/ChatPanel';
import GameModal from '../components/GameModal';
import AdminModal from '../components/AdminModal';
import UserSettingsModal from '../components/UserSettingsModal';
import VipModal from '../components/VipModal';
import SupportChatModal from '../components/SupportChatModal';
import ToastNotification from '../components/ToastNotification';



export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [matchedPartner, setMatchedPartner] = useState(null);
  const [likedPartner, setLikedPartner] = useState(null);
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('matches');
  const [loadingDeck, setLoadingDeck] = useState(true);

  // VIP state
  const [showVipModal, setShowVipModal] = useState(false);
  const [whoLikedMeData, setWhoLikedMeData] = useState({ isVip: false, totalCount: 0, candidates: [] });
  const [loadingLikes, setLoadingLikes] = useState(false);


  // Chat state
  const [activeChatMatch, setActiveChatMatch] = useState(null);

  // Game state
  const [showGame, setShowGame] = useState(false);
  const [gameTargetMatch, setGameTargetMatch] = useState(null);
  const [gameInitialSession, setGameInitialSession] = useState(null);

  // Detail modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [unmatchedNotice, setUnmatchedNotice] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Profile Report modal
  const [showProfileReportModal, setShowProfileReportModal] = useState(false);
  const [profileReportReason, setProfileReportReason] = useState('Tài khoản giả mạo');
  const [customProfileReason, setCustomProfileReason] = useState('');
  const [submittingProfileReport, setSubmittingProfileReport] = useState(false);
  const [toast, setToast] = useState(null);

  // Online users
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Notifications
  const [gameInviteNotif, setGameInviteNotif] = useState(null);
  const [matchNotif, setMatchNotif] = useState(null);

  // Discovery filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    genderPreference: 'all',
    minAge: 18,
    maxAge: 45,
    maxDistance: 5000,
  });
  const [savingFilters, setSavingFilters] = useState(false);

  // AI mode toggle
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin');
      return;
    }

    // Check payment URL query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setToast({ type: 'success', message: '🎉 Thanh toán PayOS thành công! Tài khoản VIP của bạn đã được kích hoạt.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('payment') === 'cancel') {
      setToast({ type: 'info', message: 'Giao dịch thanh toán PayOS đã bị hủy.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkProfileAndLoadData();
    return () => disconnectSocket();
  }, [user]);

  const setupSocket = useCallback((token) => {
    const socket = connectSocket(token);

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
    socket.on('new_message', ({ conversationId }) => {
      // Refresh conversations to update last message
      loadConversations();
    });
    socket.on('account_banned', ({ message }) => {
      alert(message || 'Tài khoản của bạn đã bị khóa, vui lòng sử dụng tài khoản khác');
      localStorage.removeItem('ly_token');
      window.location.href = '/login?banned=true';
    });
    socket.on('game_invite_received', ({ session, inviterName, inviterPhoto }) => {
      setGameInviteNotif({ session, inviterName, inviterPhoto });
    });

    socket.on('vip_upgraded', ({ isVip, message }) => {
      setProfile(prev => prev ? { ...prev, isVip: true } : prev);
      setToast({ type: 'success', message: message || '🎉 Bạn đã kích hoạt Tài Khoản VIP thành công!' });
      loadWhoLikedMe();
    });

    // Explicitly ask server for current online users
    socket.emit('get_online_users');
  }, []);

  const loadConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data.data.conversations || []);
    } catch { /* ignore */ }
  };

  const loadWhoLikedMe = async () => {
    setLoadingLikes(true);
    try {
      const res = await matchingApi.getWhoLikedMe();
      setWhoLikedMeData(res.data.data);
    } catch { /* ignore */ }
    finally { setLoadingLikes(false); }
  };

  useEffect(() => {
    if (activeTab === 'likes') {
      loadWhoLikedMe();
    }
  }, [activeTab, profile?.isVip]);

  // Handle Payment Return & Iframe breakout
  useEffect(() => {
    if (window.self !== window.top) {
      try {
        window.top.location.href = window.location.href;
        return;
      } catch { /* ignore */ }
    }

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setToast({ type: 'success', message: '🎉 Chúc mừng bạn đã nâng cấp Tài Khoản VIP thành công!' });
      setShowVipModal(false);
      setProfile(prev => prev ? { ...prev, isVip: true } : prev);
      userApi.getProfile().then(res => {
        const p = res.data?.data?.profile;
        if (p) setProfile(p);
      }).catch(() => { });
    } else if (paymentStatus === 'cancel') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setToast({ type: 'info', message: 'Bạn đã hủy thanh toán nâng cấp VIP.' });
    }
  }, []);


  const checkProfileAndLoadData = async () => {
    setLoadingDeck(true);
    setCandidateIdx(0);
    try {
      const res = await userApi.getProfile();
      const p = res.data.data.profile;
      setProfile(p);
      if (p && !p.isProfileComplete && (!p.fullName || !p.fullName.trim())) {
        navigate('/onboarding');
        return;
      }

      // Connect Socket.io
      const token = localStorage.getItem('ly_token');
      if (token) setupSocket(token);

      // Load Discovery Preferences
      try {
        const prefRes = await aiMatchingApi.getPreferences();
        const p = prefRes.data?.data?.preferences;
        if (p) {
          setFilters({
            genderPreference: p.genderPreference || 'all',
            minAge: p.minAge || 18,
            maxAge: p.maxAge || 45,
            maxDistance: p.maxDistance || 5000,
          });
        }
      } catch { /* ignore */ }

      // Load AI candidates
      await loadCandidates();

      // Load matches
      try {
        const matchRes = await matchingApi.getMatches();
        setMatches(matchRes.data.data.matches || []);
      } catch { /* ignore */ }

      // Load conversations
      await loadConversations();

    } catch {
      setCandidates([]);
    } finally {
      setLoadingDeck(false);
    }
  };

  const loadCandidates = async (targetUseAI = useAI) => {
    setLoadingDeck(true);
    try {
      if (targetUseAI) {
        const aiRes = await aiMatchingApi.getAICandidates();
        const aiCands = aiRes.data.data.candidates;
        if (aiCands?.length > 0) {
          setCandidates(aiCands);
          return;
        }
      }
      const candRes = await matchingApi.getCandidates();
      const apiCandidates = candRes.data.data.candidates;
      setCandidates(apiCandidates || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingDeck(false);
    }
  };

  const handleUnmatch = async (targetId, name) => {
    try { await matchingApi.unmatch(targetId); } catch { /* ignore */ }
    setMatches(prev => prev.filter(m => m.id !== targetId));
    // Giữ lại cuộc trò chuyện trong danh sách tin nhắn nhưng đánh dấu isUnmatched
    setConversations(prev => prev.map(c => {
      if (Number(c.partner?.id) === Number(targetId) || Number(c.matchId) === Number(targetId)) {
        return {
          ...c,
          isUnmatched: true,
          partner: { ...c.partner, isUnmatched: true },
        };
      }
      return c;
    }));
    setActiveChatMatch(prev => {
      if (!prev) return null;
      if (Number(prev.partner?.id || prev.id) === Number(targetId)) {
        return {
          ...prev,
          isUnmatched: true,
          partner: { ...prev.partner, isUnmatched: true },
        };
      }
      return prev;
    });
    if (selectedProfile?.id === targetId) setSelectedProfile(null);
    setUnmatchedNotice(`💔 Đã hủy ghép đôi với ${name}`);
    setTimeout(() => setUnmatchedNotice(null), 3000);
  };

  const handleApplyFilters = async (newFilters) => {
    setSavingFilters(true);
    try {
      await aiMatchingApi.updatePreferences(newFilters);
      setFilters(newFilters);
      setShowFilterModal(false);
      setToast({ type: 'success', message: '✅ Đã lưu và áp dụng bộ lọc tìm kiếm!' });
      setCandidateIdx(0);
      loadCandidates();
    } catch {
      setToast({ type: 'error', message: 'Không thể cập nhật bộ lọc' });
    } finally {
      setSavingFilters(false);
    }
  };

  const handleSwipe = async (action, targetCandidate = null) => {
    const candidateToSwipe = targetCandidate || candidates[candidateIdx];
    if (!candidateToSwipe) return;
    setLikedPartner(null);
    setMatchedPartner(null);

    try {
      const swipeRes = await matchingApi.swipe(candidateToSwipe.id, action);
      const resData = swipeRes.data.data;
      if (resData?.isMatch) {
        const partner = resData.matchedUser || candidateToSwipe;
        setMatchedPartner(partner);
        setMatchNotif(partner);
        try {
          const matchRes = await matchingApi.getMatches();
          setMatches(matchRes.data.data.matches || []);
        } catch {
          setMatches(prev => prev.some(m => m.id === partner.id) ? prev : [partner, ...prev]);
        }
        setTimeout(() => { setMatchedPartner(null); setMatchNotif(null); }, 4000);
      } else if (action === 'LIKE' || action === 'SUPER_LIKE') {
        setLikedPartner(resData?.likedUser || candidateToSwipe);
        setTimeout(() => setLikedPartner(null), 2500);
      }
    } catch {
      if (action === 'LIKE' || action === 'SUPER_LIKE') {
        setLikedPartner(candidateToSwipe);
        setTimeout(() => setLikedPartner(null), 2500);
      }
    }
    if (selectedProfile) setSelectedProfile(null);
    setCandidateIdx(prev => prev + 1);
  };

  const handleBlockUserInDashboard = (matchId, targetId, message) => {
    setMatches(prev => prev.map(m => Number(m.id) === Number(targetId) ? { ...m, isBlocked: true, isBlockedByMe: true } : m));
    setConversations(prev => prev.map(c => Number(c.partner?.id) === Number(targetId) ? { ...c, isBlocked: true, isBlockedByMe: true, partner: { ...c.partner, isBlocked: true, isBlockedByMe: true } } : c));
    setActiveChatMatch(prev => {
      if (!prev) return prev;
      if (Number(prev.partner?.id || prev.id) === Number(targetId)) {
        return {
          ...prev,
          isBlocked: true,
          isBlockedByMe: true,
          partner: { ...prev.partner, isBlocked: true, isBlockedByMe: true },
        };
      }
      return prev;
    });
    if (message) {
      setToast({ type: 'info', message });
    }
  };

  const handleUnblockUserInDashboard = (matchId, targetId, message) => {
    setMatches(prev => prev.map(m => Number(m.id) === Number(targetId) ? { ...m, isBlocked: m.isBlockedByPartner || false, isBlockedByMe: false } : m));
    setConversations(prev => prev.map(c => Number(c.partner?.id) === Number(targetId) ? { ...c, isBlocked: c.isBlockedByPartner || false, isBlockedByMe: false, partner: { ...c.partner, isBlocked: c.isBlockedByPartner || false, isBlockedByMe: false } } : c));
    setActiveChatMatch(prev => {
      if (!prev) return prev;
      if (Number(prev.partner?.id || prev.id) === Number(targetId)) {
        const stillBlocked = prev.isBlockedByPartner || false;
        return {
          ...prev,
          isBlocked: stillBlocked,
          isBlockedByMe: false,
          partner: { ...prev.partner, isBlocked: stillBlocked, isBlockedByMe: false },
        };
      }
      return prev;
    });
    if (message) {
      setToast({ type: 'info', message });
    }
  };

  const openChat = async (match) => {
    setActiveChatMatch(match);
    setActiveTab('messages');
  };

  const openDetailProfile = (person) => {
    const matchedObj = matches.find(m => Number(m.id) === Number(person.id || person.userId));
    setSelectedProfile({
      ...person,
      isBlocked: matchedObj?.isBlocked || person?.isBlocked || false,
    });
    setActivePhotoIdx(0);
  };

  const handleSubmitProfileReport = async () => {
    if (!selectedProfile?.id && !selectedProfile?.userId) return;
    const targetId = selectedProfile.id || selectedProfile.userId;
    const finalReason = profileReportReason === 'Khác'
      ? customProfileReason.trim() || 'Khác'
      : profileReportReason;
    setSubmittingProfileReport(true);
    try {
      await userApi.reportUser(targetId, finalReason);
      setShowProfileReportModal(false);
      setToast({ type: 'success', message: 'Đã gửi báo cáo hồ sơ thành công. Cảm ơn bạn đã hỗ trợ giữ gìn cộng đồng an toàn!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi gửi báo cáo' });
    } finally {
      setSubmittingProfileReport(false);
    }
  };

  const openGame = (match, initialSession = null) => {
    setGameTargetMatch(match);
    setGameInitialSession(initialSession);
    setShowGame(true);
  };

  const currentCandidate = candidates[candidateIdx];
  const defaultFemaleAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
  const defaultMaleAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400';
  const defaultNeutralAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2394a3b8"><rect width="100" height="100" fill="%23334155"/><circle cx="50" cy="38" r="20" fill="%23cbd5e1"/><path d="M20 85c0-18 14-30 30-30s30 12 30 30" fill="%23cbd5e1"/></svg>';

  const getDefaultAvatar = (gender) => {
    const g = String(gender || '').toUpperCase();
    if (['FEMALE', 'NỮ'].includes(g)) return defaultFemaleAvatar;
    if (['MALE', 'NAM'].includes(g)) return defaultMaleAvatar;
    return defaultNeutralAvatar;
  };
  const defaultAvatar = defaultNeutralAvatar;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1115', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .action-btn-pass {
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease, background-color 0.25s ease !important;
        }
        .action-btn-pass:hover {
          transform: scale(1.22) !important;
          box-shadow: 0 12px 30px rgba(255, 68, 88, 0.5) !important;
          background-color: rgba(255, 68, 88, 0.15) !important;
        }
        .action-btn-pass:active {
          transform: scale(0.92) !important;
        }

        .action-btn-like {
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease, background-color 0.25s ease !important;
        }
        .action-btn-like:hover {
          transform: scale(1.22) !important;
          box-shadow: 0 12px 30px rgba(52, 211, 153, 0.5) !important;
          background-color: rgba(52, 211, 153, 0.15) !important;
        }
        .action-btn-like:active {
          transform: scale(0.92) !important;
        }
      `}</style>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{
        position: 'relative',
        flex: isSidebarExpanded ? 2 : 'none',
        width: isSidebarExpanded ? 'auto' : '350px',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        background: '#181c22', borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Divider Expand/Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarExpanded(prev => !prev)}
          style={{
            position: 'absolute',
            right: '-14px',
            top: '24px',
            zIndex: 100,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fd267d, #ff6036)',
            border: '2px solid #0f1115',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
            fontSize: '0.7rem',
            fontWeight: 800,
            transition: 'transform 0.2s ease',
          }}
          title={isSidebarExpanded ? "Thu nhỏ thanh bên" : "Phóng to thanh bên (Tỷ lệ 2/3)"}
        >
          {isSidebarExpanded ? '◀' : '▶'}
        </button>

        {/* Profile Header */}
        <div style={{ background: 'linear-gradient(135deg, #fd267d, #ff6036)', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => setShowSettingsModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
            <div className={profile?.isVip ? 'vip-avatar-glow' : ''} style={{ position: 'relative' }}>
              <img
                src={profile?.profilePicture || getDefaultAvatar(profile?.gender || user?.gender)}
                alt="My Avatar"
                onError={e => { e.target.src = getDefaultAvatar(profile?.gender || user?.gender); }}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: profile?.isVip ? 'none' : '2px solid #fff' }}
              />
              <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: '#34D399', border: '2px solid #fd267d' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {profile?.fullName || user?.fullName || user?.username}
                {profile?.isVip && (
                  <span className="vip-badge-gradient" style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px' }}>👑 VIP</span>
                )}
                {(user?.role === 'ADMIN' || profile?.role === 'ADMIN') && (
                  <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#000', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>ADMIN</span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.82, display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.85)' }}>
                @{profile?.username || user?.username || 'user'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setShowSupportModal(true)}
              style={{
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#93C5FD', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '14px',
                padding: '6px 10px', fontWeight: '700', fontSize: '0.78rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'all 0.2s ease',
              }}
              title="Liên hệ hỗ trợ Admin"
            >
              🎧 Hỗ trợ
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '14px',
                padding: '6px 10px', fontWeight: '700', fontSize: '0.78rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'all 0.2s ease',
              }}
              title="Cài đặt tài khoản"
            >
              ⚙️
            </button>

            {(user?.role === 'ADMIN' || profile?.role === 'ADMIN') && (
              <button
                onClick={() => setShowAdminModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', border: 'none', borderRadius: '14px',
                  padding: '6px 10px', fontWeight: '700', fontSize: '0.78rem',
                  cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                👑
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'matches', label: `Matches (${matches.length})` },
            { id: 'messages', label: `💬 Tin nhắn` },
            { id: 'likes', label: `❤️ Ai Thích Tôi` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '0.85rem 0.4rem', background: 'transparent', border: 'none',
                color: activeTab === t.id ? '#fd267d' : 'rgba(255,255,255,0.6)',
                borderBottom: activeTab === t.id ? '2px solid #fd267d' : 'none',
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sidebar Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {activeTab === 'matches' && (
            matches.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                {matches.map((m, i) => {
                  const isOnline = onlineUsers.has(m.id);
                  return (
                    <div
                      key={i}
                      onClick={() => openDetailProfile(m)}
                      style={{
                        position: 'relative', height: '140px', borderRadius: '12px', overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)', background: '#000', cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />

                      {/* Online indicator */}
                      {isOnline && (
                        <div style={{
                          position: 'absolute', top: '6px', left: '6px', zIndex: 5,
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: '#34D399', border: '2px solid #181c22',
                          boxShadow: '0 0 6px rgba(52,211,153,0.8)',
                        }} />
                      )}

                      {/* Unmatch */}
                      <button
                        onClick={e => { e.stopPropagation(); handleUnmatch(m.id, m.name); }}
                        style={{
                          position: 'absolute', top: '6px', right: '6px', zIndex: 10,
                          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,68,88,0.4)',
                          color: '#ff4458', borderRadius: '50%', width: '24px', height: '24px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem',
                        }}
                      >💔</button>

                      {/* Chat button */}
                      <button
                        onClick={e => { e.stopPropagation(); openChat({ matchId: m.matchId || m.id, isBlocked: m.isBlocked, partner: { id: m.id, name: m.name, photo: m.photo, isBlocked: m.isBlocked } }); }}
                        style={{
                          position: 'absolute', bottom: '28px', right: '6px', zIndex: 10,
                          background: 'rgba(253,38,125,0.85)', border: 'none',
                          color: '#fff', borderRadius: '50%', width: '24px', height: '24px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem',
                        }}
                      >💬</button>

                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontWeight: 700, fontSize: '0.82rem' }}>
                        {m.name}, {m.age}
                        {m.aiScore && <span style={{ color: '#fd267d', fontSize: '0.7rem', marginLeft: '0.3rem' }}>⭐{m.aiScore}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '3rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💫</div>
                <p style={{ fontSize: '0.9rem' }}>Chưa có lượt Match nào.<br />Bắt đầu quẹt thẻ để tìm đối phương!</p>
              </div>
            )
          )}

          {activeTab === 'messages' && (
            <div>
              {activeChatMatch ? (
                <div style={{ height: 'calc(100vh - 200px)' }}>
                  <ChatPanel
                    match={activeChatMatch}
                    currentUserId={profile?.userId || user?.userId}
                    currentUserProfile={profile}
                    isOnline={onlineUsers.has(Number(activeChatMatch?.partner?.id || activeChatMatch?.id))}
                    onClose={() => setActiveChatMatch(null)}
                    onInviteGame={openGame}
                    onBlockUser={handleBlockUserInDashboard}
                    onUnblockUser={handleUnblockUserInDashboard}
                  />
                </div>
              ) : conversations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {conversations.map((conv, i) => {
                    const isOnline = onlineUsers.has(Number(conv.partner?.id));
                    return (
                      <div
                        key={i}
                        onClick={() => openChat(conv)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.8rem',
                          padding: '0.75rem', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.06)',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={conv.partner?.photo || getDefaultAvatar(conv.partner?.gender)}
                            alt={conv.partner?.name}
                            onError={e => { e.target.src = getDefaultAvatar(conv.partner?.gender); }}
                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          {isOnline && !conv.isUnmatched && (
                            <div style={{
                              position: 'absolute', bottom: '1px', right: '1px',
                              width: '10px', height: '10px', borderRadius: '50%',
                              background: '#34D399', border: '2px solid #181c22',
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{conv.partner?.name}</div>
                            {conv.isUnmatched && (
                              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,68,88,0.2)', color: '#ff6b8a', fontWeight: 600 }}>
                                💔 Đã hủy match
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.lastMessage?.content || (conv.isUnmatched ? 'Đã hủy ghép đôi' : 'Bắt đầu trò chuyện nào!')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '3rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                  <p style={{ fontSize: '0.85rem' }}>Chọn một Match để bắt đầu nhắn tin!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'likes' && (
            <div>
              {!profile?.isVip ? (
                /* LOCKED VIP BANNER (Immediately shown for Non-VIP, zero loading delay) */
                <div style={{
                  background: 'linear-gradient(145deg, rgba(255,0,128,0.15), rgba(255,215,0,0.15))',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '20px', padding: '1.5rem 1rem', textAlign: 'center',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒👑</div>
                  <h3 style={{ fontSize: '1.1rem', color: '#FFD700', fontWeight: 800, marginBottom: '0.4rem' }}>
                    {whoLikedMeData.totalCount > 0 ? `Có ${whoLikedMeData.totalCount} người đã thả tim cho bạn!` : 'Mở Khóa Tính Năng VIP'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                    Nâng cấp Tài Khoản VIP chỉ <b>3.000 VNĐ</b> để xem ngay danh sách những ai đã thích bạn và quẹt match tức thì!
                  </p>

                  <button
                    onClick={() => setShowVipModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #FF007F, #FF8C00, #FFD700)',
                      color: '#000', border: 'none', borderRadius: '16px',
                      padding: '0.75rem 1.4rem', fontWeight: 800, fontSize: '0.9rem',
                      cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,0,128,0.5)',
                      width: '100%',
                    }}
                  >
                    👑 Nâng Cấp VIP Ngay (3.000đ)
                  </button>
                </div>
              ) : loadingLikes ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '2rem 0' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.8rem auto', width: '28px', height: '28px' }} />
                  <p style={{ fontSize: '0.8rem' }}>Đang tải danh sách người thích bạn...</p>
                </div>
              ) : whoLikedMeData.candidates.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                  {whoLikedMeData.candidates.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => openDetailProfile(c)}
                      style={{
                        position: 'relative', height: '150px', borderRadius: '14px', overflow: 'hidden',
                        border: '1px solid rgba(255,215,0,0.3)', background: '#000', cursor: 'pointer',
                      }}
                    >
                      <img src={c.photo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }} />

                      {/* Quick Match Button */}
                      <button
                        onClick={e => { e.stopPropagation(); handleSwipe('LIKE', c); }}
                        style={{
                          position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                          background: 'linear-gradient(135deg, #fd267d, #ff6036)', border: 'none',
                          color: '#fff', borderRadius: '20px', padding: '4px 10px',
                          cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem',
                          boxShadow: '0 4px 10px rgba(253,38,125,0.5)',
                        }}
                      >
                        ⚡ Match Ngay
                      </button>

                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.name}, {c.age}
                          {c.isVip && <span style={{ fontSize: '0.65rem' }}>👑</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 600 }}>❤️ Đã thích bạn</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '3rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💌</div>
                  <p style={{ fontSize: '0.85rem' }}>Chưa có ai thả tim cho bạn.<br />Hãy cập nhật profile đẹp hơn nhé!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN SWIPING AREA ── */}
      <main style={{
        flex: isSidebarExpanded ? 3 : 1,
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: '2rem'
      }}>

        {/* Top Controls: Filter & AI Mode Toggle */}
        <div style={{ position: 'absolute', top: '1.2rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', zIndex: 50 }}>
          {/* Discovery Filter Button */}
          <button
            onClick={() => setShowFilterModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '18px',
              background: (filters.genderPreference !== 'all' || filters.minAge > 18 || filters.maxAge < 45 || filters.maxDistance < 5000)
                ? 'linear-gradient(135deg, #fd267d, #ff6036)'
                : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: (filters.genderPreference !== 'all' || filters.minAge > 18 || filters.maxAge < 45 || filters.maxDistance < 5000)
                ? '0 4px 12px rgba(253,38,125,0.4)'
                : 'none',
            }}
            title="Bộ lọc tìm kiếm (Giới tính, Độ tuổi, Khoảng cách)"
          >
            <span>🎯</span>
            <span>Bộ lọc</span>
            {(filters.genderPreference !== 'all' || filters.minAge > 18 || filters.maxAge < 45 || filters.maxDistance < 5000) && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
            )}
          </button>

          {/* AI Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
              {useAI ? '🤖 AI Match' : '📋 Normal'}
            </span>
            <div
              onClick={() => {
                const nextUseAI = !useAI;
                setUseAI(nextUseAI);
                setCandidateIdx(0);
                loadCandidates(nextUseAI);
              }}
              title={useAI ? 'Tắt AI Match để xem danh sách ngẫu nhiên' : 'Bật AI Match để gợi ý đối tượng ăn ý nhất'}
              style={{
                width: '38px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                background: useAI ? '#fd267d' : 'rgba(255,255,255,0.2)',
                position: 'relative', transition: 'background 0.3s ease',
              }}
            >
              <div style={{
                position: 'absolute', top: '2px',
                left: useAI ? '20px' : '2px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.3s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
          </div>
        </div>

        {/* MATCH BANNER */}
        {matchedPartner && (
          <div style={{
            position: 'absolute', top: '2rem', zIndex: 100,
            background: 'linear-gradient(135deg, #fd267d, #ff6036)',
            padding: '1.1rem 2.2rem', borderRadius: '30px', fontWeight: 800, fontSize: '1.2rem',
            boxShadow: '0 10px 35px rgba(253,38,125,0.7)', border: '2px solid rgba(255,255,255,0.4)',
            textAlign: 'center', color: '#fff', animation: 'slideDown 0.4s ease',
          }}>
            🎉 Match! Bạn và {matchedPartner.name} đã thích nhau!
          </div>
        )}

        {/* LIKE BANNER */}
        {likedPartner && !matchedPartner && (
          <div style={{
            position: 'absolute', top: '2rem', zIndex: 100,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '0.8rem 1.8rem', borderRadius: '24px', fontWeight: 600, fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            💖 Bạn đã thích {likedPartner.name}!
          </div>
        )}

        {/* UNMATCHED NOTICE */}
        {unmatchedNotice && (
          <div style={{
            position: 'absolute', top: '2rem', zIndex: 100,
            background: 'rgba(255,68,88,0.15)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,68,88,0.4)', color: '#ff4458',
            padding: '0.8rem 1.8rem', borderRadius: '24px', fontWeight: 700, fontSize: '1rem',
          }}>
            {unmatchedNotice}
          </div>
        )}

        {/* GAME INVITE NOTIFICATION */}
        {gameInviteNotif && (() => {
          const inviterMatch = matches.find(m => Number(m.id) === Number(gameInviteNotif.session?.initiatorId));
          const avatarUrl = inviterMatch?.photo || gameInviteNotif.inviterPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
          const name = inviterMatch?.name || gameInviteNotif.inviterName || 'Đối phương';

          return (
            <div style={{
              position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 2200,
              background: 'linear-gradient(145deg, #1f2430, #141822)',
              border: '1px solid rgba(253,38,125,0.5)',
              borderRadius: '20px', padding: '1.1rem 1.3rem', width: '310px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(253,38,125,0.25)',
              animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              {/* Inviter Info Header with Round Avatar & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.9rem' }}>
                <img
                  src={avatarUrl}
                  alt={name}
                  style={{
                    width: '50px', height: '50px', borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid #fd267d',
                    boxShadow: '0 0 12px rgba(253,38,125,0.4)', flexShrink: 0,
                  }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff', lineHeight: '1.35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#fd267d', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    🎮 Mời bạn cùng chơi Mini Game!
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => {
                    const socket = getSocket();
                    const { session } = gameInviteNotif;
                    const matchForGame = inviterMatch
                      ? { ...inviterMatch, partner: { id: inviterMatch.id, name: inviterMatch.name, photo: inviterMatch.photo } }
                      : {
                        matchId: session.matchId,
                        id: session.initiatorId,
                        name,
                        photo: avatarUrl,
                        partner: { id: session.initiatorId, name, photo: avatarUrl },
                      };
                    openGame(matchForGame, session);
                    setGameInviteNotif(null);
                    setTimeout(() => {
                      if (socket) socket.emit('game_accept', { sessionId: session.sessionId });
                    }, 100);
                  }}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                    border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(253,38,125,0.4)',
                  }}
                >
                  ✓ Chấp nhận
                </button>
                <button
                  onClick={() => {
                    const socket = getSocket();
                    if (socket && gameInviteNotif?.session?.sessionId) {
                      socket.emit('game_leave', { sessionId: gameInviteNotif.session.sessionId });
                    }
                    setGameInviteNotif(null);
                  }}
                  style={{
                    padding: '0.6rem 0.9rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  }}
                >
                  Từ chối
                </button>
              </div>
            </div>
          );
        })()}

        {/* SWIPE DECK */}
        {loadingDeck ? (
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              {useAI ? '🤖 AI đang tìm người phù hợp...' : 'Đang tìm kiếm đối tượng...'}
            </p>
          </div>
        ) : (!currentCandidate || candidateIdx >= candidates.length) ? (
          <div style={{
            width: '380px', minHeight: '460px', borderRadius: '24px', padding: '2.5rem 1.5rem',
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌟</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem', color: '#fff' }}>
              Hết hồ sơ gợi ý rồi!
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '1.8rem' }}>
              {useAI ? 'AI đã gợi ý hết những người phù hợp nhất!' : 'Bạn đã xem hết danh sách hôm nay.'}
            </p>
            <button
              onClick={() => { setCandidateIdx(0); loadCandidates(); }}
              className="btn btn-primary"
              style={{ padding: '0.8rem 1.8rem', borderRadius: '20px', fontWeight: 700 }}
            >🔄 Tải lại</button>
          </div>
        ) : (
          <>
            {/* Candidate Card */}
            <div
              onClick={() => openDetailProfile(currentCandidate)}
              className={currentCandidate.isVip ? 'vip-card-glow' : ''}
              style={{
                width: '380px', height: '560px', borderRadius: '16px', overflow: 'hidden',
                position: 'relative', background: '#000', boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                border: currentCandidate.isVip ? 'none' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'transform 0.3s ease',
              }}
            >
              <img src={currentCandidate.photo} alt={currentCandidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)', pointerEvents: 'none' }} />

              {/* AI Score Badge */}
              {currentCandidate.aiScore && (
                <div style={{
                  position: 'absolute', top: '1rem', left: '1rem',
                  background: 'linear-gradient(135deg, #fd267d, #ff6036)',
                  color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '20px',
                  fontSize: '0.75rem', fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(253,38,125,0.4)',
                }}>
                  🤖 {currentCandidate.aiScore}% ăn ý
                </div>
              )}

              {/* VIP Badge on card */}
              {currentCandidate.isVip && (
                <div className="vip-badge-gradient" style={{
                  position: 'absolute', top: '1rem', left: currentCandidate.aiScore ? '7.5rem' : '1rem',
                  padding: '0.3rem 0.7rem', borderRadius: '20px',
                  fontSize: '0.75rem', zIndex: 10,
                }}>
                  👑 VIP Account
                </div>
              )}

              <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
                ℹ️ Xem chi tiết
              </div>

              <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>{currentCandidate.name}</span>
                  <span style={{ fontSize: '1.7rem', fontWeight: 400 }}>{currentCandidate.age}</span>
                  <span style={{ color: '#20d5ec', fontSize: '1.3rem' }}>✓</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.3rem' }}>📍 {currentCandidate.location}</div>
                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.6rem', lineHeight: '1.4' }}>{currentCandidate.bio}</p>
                {Array.isArray(currentCandidate.tags) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.8rem' }}>
                    {currentCandidate.tags.map((tag, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '14px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', backdropFilter: 'blur(4px)' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginTop: '1.8rem', justifyContent: 'center' }}>
              <button className="action-btn-pass" onClick={() => handleSwipe('PASS')} style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#181c22', border: '2px solid #ff4458', color: '#ff4458', fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 25px rgba(255,68,88,0.25)' }}>✕</button>
              <button className="action-btn-like" onClick={() => handleSwipe('LIKE')} style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#181c22', border: '2px solid #34D399', color: '#34D399', fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 25px rgba(52,211,153,0.25)' }}>💖</button>
            </div>
          </>
        )}
      </main>

      {/* ── DETAIL PROFILE MODAL ── */}
      {selectedProfile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
          <div
            className={selectedProfile.isVip ? 'vip-profile-modal-glow' : ''}
            style={{
              width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', background: '#181c22',
              borderRadius: '24px',
              border: selectedProfile.isVip ? 'none' : '1px solid rgba(255,255,255,0.15)',
              boxShadow: selectedProfile.isVip ? '0 0 40px rgba(255,215,0,0.5), 0 25px 70px rgba(0,0,0,0.9)' : '0 25px 70px rgba(0,0,0,0.8)',
              position: 'relative', display: 'flex', flexDirection: 'column',
            }}
          >

            {/* Top bar */}
            <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(24,28,34,0.95)', backdropFilter: 'blur(10px)', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setSelectedProfile(null)} className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.88rem' }}>← Quay lại</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Hồ sơ của {selectedProfile.name}</span>
                {selectedProfile.isVip && (
                  <span className="vip-badge-gradient" style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '8px' }}>👑 VIP</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  onClick={() => {
                    if (profile?.role !== 'ADMIN' && (!profile?.isEmailVerified || !profile?.isCitizenVerified)) {
                      setToast({
                        type: 'warning',
                        message: 'Chỉ những tài khoản đã xác thực đầy đủ (Email & CCCD) mới có thể gửi báo cáo người dùng. Vui lòng vào Cài Đặt để xác thực.',
                      });
                      return;
                    }
                    setShowProfileReportModal(true);
                  }}
                  title="Báo cáo vi phạm hồ sơ"
                  style={{
                    background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                    color: '#F59E0B', borderRadius: '10px', padding: '0.35rem 0.7rem',
                    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  ⚠️ Báo cáo
                </button>
                <button onClick={() => setSelectedProfile(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            {/* Photos */}
            <div style={{ position: 'relative', width: '100%', height: '420px', background: '#000' }}>
              <img src={Array.isArray(selectedProfile.photos) && selectedProfile.photos.length > 0 ? selectedProfile.photos[activePhotoIdx] || selectedProfile.photo : selectedProfile.photo} alt={selectedProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {Array.isArray(selectedProfile.photos) && selectedProfile.photos.length > 1 && (
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', display: 'flex', gap: '6px', zIndex: 10 }}>
                  {selectedProfile.photos.map((_, pIdx) => (
                    <div key={pIdx} onClick={() => setActivePhotoIdx(pIdx)} style={{ flex: 1, height: '4px', borderRadius: '2px', cursor: 'pointer', background: activePhotoIdx === pIdx ? '#FF2D55' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s ease' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{selectedProfile.name}</h2>
                    <span style={{ fontSize: '1.5rem', fontWeight: 400 }}>{selectedProfile.age}</span>
                    {selectedProfile.isVip && (
                      <span
                        className="vip-badge-gradient"
                        style={{
                          fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px',
                          fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px',
                          letterSpacing: '0.5px', textTransform: 'uppercase',
                        }}
                      >
                        👑 VIP MEMBER
                      </span>
                    )}
                    {selectedProfile.aiScore && <span style={{ background: 'rgba(253,38,125,0.2)', color: '#fd267d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>🤖 {selectedProfile.aiScore}%</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.3rem' }}>📍 {selectedProfile.location}</div>
                </div>
                {selectedProfile.height && (
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.4rem 0.9rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                    📏 {selectedProfile.height} cm
                  </div>
                )}
              </div>

              {selectedProfile.bio && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Giới thiệu</div>
                  <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6', margin: 0 }}>{selectedProfile.bio}</p>
                </div>
              )}

              {Array.isArray(selectedProfile.tags) && selectedProfile.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Sở thích</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedProfile.tags.map((tag, i) => (
                      <span key={i} style={{ background: 'rgba(253,38,125,0.15)', color: '#FF2D55', border: '1px solid rgba(253,38,125,0.3)', borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.82rem', fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {matches.some(m => m.id === selectedProfile.id) ? (
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button
                    onClick={() => {
                      const matchedObj = matches.find(m => m.id === selectedProfile.id);
                      const isBlocked = matchedObj?.isBlocked || selectedProfile?.isBlocked || false;
                      openChat({ matchId: matchedObj?.matchId || selectedProfile.id, isBlocked, partner: { id: selectedProfile.id, name: selectedProfile.name, photo: selectedProfile.photo, isBlocked } });
                      setSelectedProfile(null);
                      setActiveTab('messages');
                    }}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '14px', background: 'linear-gradient(135deg, #fd267d, #ff6036)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >💬 Nhắn tin</button>
                  <button
                    onClick={() => handleUnmatch(selectedProfile.id, selectedProfile.name)}
                    style={{ padding: '0.8rem 1rem', borderRadius: '14px', background: 'rgba(255,68,88,0.08)', border: '1px solid rgba(255,68,88,0.3)', color: '#ff4458', cursor: 'pointer' }}
                  >💔</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={() => handleSwipe('PASS', selectedProfile)} style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#181c22', border: '2px solid #ff4458', color: '#ff4458', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  <button onClick={() => handleSwipe('LIKE', selectedProfile)} style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#181c22', border: '2px solid #34D399', color: '#34D399', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💖</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GAME MODAL ── */}
      {showGame && gameTargetMatch && (
        <GameModal
          match={gameTargetMatch}
          currentUserId={profile?.userId || user?.userId}
          initialSession={gameInitialSession}
          onClose={() => { setShowGame(false); setGameTargetMatch(null); setGameInitialSession(null); }}
        />
      )}
      {/* ── ADMIN MODAL ── */}
      {showAdminModal && (
        <AdminModal onClose={() => setShowAdminModal(false)} />
      )}

      {/* ── SUPPORT CHAT MODAL ── */}
      {showSupportModal && (
        <SupportChatModal onClose={() => setShowSupportModal(false)} currentUserProfile={profile} />
      )}

      {/* ── PROFILE REPORT MODAL ── */}
      {showProfileReportModal && selectedProfile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#1e232a', border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: '16px', padding: '1.5rem', maxWidth: '380px', width: '100%',
            color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                Báo cáo hồ sơ {selectedProfile.name}
              </h3>
              <button
                onClick={() => setShowProfileReportModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer' }}
              >✕</button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.8rem' }}>
              Chọn lý do báo cáo hồ sơ:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.8rem' }}>
              {['Tài khoản giả mạo', 'Hình ảnh nhạy cảm', 'Khác'].map(reason => (
                <label key={reason} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  height: '42px', padding: '0 0.8rem', borderRadius: '10px',
                  boxSizing: 'border-box',
                  background: profileReportReason === reason ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  border: profileReportReason === reason ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#fff',
                  transition: 'all 0.2s ease',
                }}>
                  <input
                    type="radio"
                    name="profileReportReason"
                    checked={profileReportReason === reason}
                    onChange={() => setProfileReportReason(reason)}
                    style={{ accentColor: '#F59E0B', width: '16px', height: '16px', margin: 0 }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {profileReportReason === 'Khác' && (
              <textarea
                rows={3}
                placeholder="Mô tả thêm chi tiết vi phạm..."
                value={customProfileReason}
                onChange={e => setCustomProfileReason(e.target.value)}
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
                onClick={() => setShowProfileReportModal(false)}
                disabled={submittingProfileReport}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}
              >Hủy</button>
              <button
                onClick={handleSubmitProfileReport}
                disabled={submittingProfileReport}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}
              >{submittingProfileReport ? 'Đang gửi...' : 'Gửi báo cáo'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISCOVERY FILTER MODAL ── */}
      {showFilterModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2100,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #181c24, #12151b)',
            border: '1px solid rgba(253,38,125,0.3)',
            borderRadius: '24px', padding: '1.8rem', width: '100%', maxWidth: '440px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(253,38,125,0.15)',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🎯</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  Bộ Lọc Tìm Kiếm Đối Tượng
                </h3>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)',
                  borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Gender Preference */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '0.6rem' }}>
                  Tôi muốn tìm kiếm:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'MALE', label: 'Nam' },
                    { value: 'FEMALE', label: 'Nữ' },
                    { value: 'OTHER', label: 'Khác' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilters(f => ({ ...f, genderPreference: opt.value }))}
                      style={{
                        flex: 1, padding: '0.5rem 0.6rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700,
                        cursor: 'pointer', border: 'none',
                        background: filters.genderPreference === opt.value
                          ? 'linear-gradient(135deg, #fd267d, #ff6036)'
                          : 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        border: `1px solid ${filters.genderPreference === opt.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: filters.genderPreference === opt.value ? '0 4px 12px rgba(253,38,125,0.4)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Độ tuổi</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fd267d' }}>{filters.minAge} - {filters.maxAge} tuổi</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.3rem' }}>Tối thiểu: {filters.minAge}</label>
                    <input
                      type="range" min="18" max="60" value={filters.minAge}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFilters(f => ({ ...f, minAge: val, maxAge: Math.max(val, f.maxAge) }));
                      }}
                      style={{ width: '100%', accentColor: '#fd267d' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.3rem' }}>Tối đa: {filters.maxAge}</label>
                    <input
                      type="range" min="18" max="70" value={filters.maxAge}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFilters(f => ({ ...f, maxAge: val, minAge: Math.min(val, f.minAge) }));
                      }}
                      style={{ width: '100%', accentColor: '#fd267d' }}
                    />
                  </div>
                </div>
              </div>

              {/* Distance */}
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Khoảng cách tối đa</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34D399' }}>{filters.maxDistance} km</span>
                </div>
                <input
                  type="range" min="5" max="5000" step="25" value={filters.maxDistance}
                  onChange={e => setFilters(f => ({ ...f, maxDistance: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#34D399' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const defaultFilters = { genderPreference: 'all', minAge: 18, maxAge: 45, maxDistance: 5000 };
                    handleApplyFilters(defaultFilters);
                  }}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  }}
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  disabled={savingFilters}
                  onClick={() => handleApplyFilters(filters)}
                  style={{
                    flex: 1, padding: '0.75rem 1.4rem', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #fd267d, #ff6036)', border: 'none',
                    color: '#fff', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 800,
                    boxShadow: '0 4px 15px rgba(253,38,125,0.4)',
                  }}
                >
                  {savingFilters ? 'Đang lưu...' : 'Áp dụng bộ lọc ✨'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIP MODAL ── */}
      {showVipModal && (
        <VipModal
          isVip={Boolean(profile?.isVip)}
          onClose={() => setShowVipModal(false)}
          onVipSuccess={(vipState) => {
            setProfile(prev => prev ? { ...prev, isVip: vipState } : prev);
            loadWhoLikedMe();
            loadCandidates();
          }}
          setToast={setToast}
        />
      )}

      {/* ── USER SETTINGS MODAL ── */}
      {showSettingsModal && (
        <UserSettingsModal
          profile={profile}
          onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
          onLogout={logout}
          onClose={() => setShowSettingsModal(false)}
          setToast={setToast}
        />
      )}

      {/* ── FLOATING BOTTOM-RIGHT VIP SUGGESTION BUTTON ── */}
      <button
        onClick={() => setShowVipModal(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          background: profile?.isVip
            ? 'linear-gradient(135deg, #FFD700, #FF007F)'
            : 'linear-gradient(135deg, #FF007F, #FF8C00, #FFD700)',
          color: profile?.isVip ? '#000' : '#fff',
          border: '2px solid rgba(255,215,0,0.6)',
          borderRadius: '30px',
          padding: '12px 22px',
          fontWeight: 800,
          fontSize: '0.92rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: profile?.isVip
            ? '0 8px 25px rgba(255,215,0,0.5)'
            : '0 8px 30px rgba(255,0,128,0.6)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
        title="Nâng cấp tài khoản VIP Account (3.000 VNĐ)"
      >
        <span style={{ fontSize: '1.2rem' }}>👑</span>
        <span>{profile?.isVip ? 'Tài Khoản VIP' : 'Nâng VIP (3.000đ)'}</span>
      </button>

      {/* ── TOAST NOTIFICATION ── */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
