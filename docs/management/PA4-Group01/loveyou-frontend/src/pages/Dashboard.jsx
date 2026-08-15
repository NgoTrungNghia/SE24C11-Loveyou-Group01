import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, userApi, matchingApi } from '../utils/api';

const FALLBACK_CANDIDATES = [
  {
    id: -1,
    name: 'Mai Phương',
    age: 22,
    location: 'TP. Hồ Chí Minh • 3 km',
    height: 165,
    bio: 'Yêu âm nhạc, thích đi cafe chill cuối tuần và chụp ảnh phim 📸✨. Đang tìm kiếm một tâm hồn đồng điệu để cùng đi xem hòa nhạc!',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['🎵 Music', '☕ Coffee', '📸 Photography'],
  },
  {
    id: -2,
    name: 'Thanh Hằng',
    age: 24,
    location: 'Hà Nội • 5 km',
    height: 168,
    bio: 'Gym, yoga và lối sống lành mạnh. Đang tìm một người cùng tập luyện 🏋️‍♀️🧘‍♀️',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['🏋️ Gym', '🧘 Yoga', '✈️ Travel'],
  },
  {
    id: -3,
    name: 'Bảo Ngọc',
    age: 23,
    location: 'Đà Nẵng • 2 km',
    height: 162,
    bio: 'Đam mê du lịch và ẩm thực. Thích nuôi mèo 🐱 và nấu ăn 🍳',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['✈️ Travel', '🐱 Pets', '🍳 Cooking'],
  },
  {
    id: -4,
    name: 'Minh Anh',
    age: 25,
    location: 'TP. Hồ Chí Minh • 7 km',
    height: 170,
    bio: 'Software engineer 💻 thích chơi game 🎮 và xem phim chiếu rạp 🎬',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['💻 Coding', '🎮 Gaming', '🎬 Movies'],
  },
  {
    id: -5,
    name: 'Hoàng Nam',
    age: 26,
    location: 'TP. Hồ Chí Minh • 4 km',
    height: 178,
    bio: 'Nhiếp ảnh tự do 📸 yêu cắm trại và khám phá những vùng đất mới 🏕️',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    ],
    tags: ['📸 Photography', '✈️ Travel', '☕ Coffee'],
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [matchedPartner, setMatchedPartner] = useState(null);
  const [likedPartner, setLikedPartner] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('matches'); // matches | messages
  const [loadingDeck, setLoadingDeck] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Detail Modal Profile View State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [unmatchedNotice, setUnmatchedNotice] = useState(null);

  useEffect(() => {
    checkProfileAndLoadData();
  }, []);

  const handleUnmatch = async (targetId, name) => {
    try {
      await matchingApi.unmatch(targetId);
    } catch {
      /* ignore */
    } finally {
      setMatches(prev => prev.filter(m => m.id !== targetId));
      if (selectedProfile && selectedProfile.id === targetId) {
        setSelectedProfile(null);
      }
      setLikedPartner(null);
      setMatchedPartner(null);
      setUnmatchedNotice(`💔 Đã hủy ghép đôi với ${name}`);
      setTimeout(() => setUnmatchedNotice(null), 3000);
    }
  };

  const checkProfileAndLoadData = async () => {
    setLoadingDeck(true);
    setCandidateIdx(0);
    try {
      // 1. Fetch User Profile
      const res = await userApi.getProfile();
      const p = res.data.data.profile;
      setProfile(p);
      if (p && !p.isProfileComplete) {
        navigate('/onboarding');
        return;
      }

      // 2. Fetch Swiping Candidates Deck from Backend
      try {
        const candRes = await matchingApi.getCandidates();
        const apiCandidates = candRes.data.data.candidates;
        if (apiCandidates && apiCandidates.length > 0) {
          setCandidates(apiCandidates);
        } else {
          setCandidates(FALLBACK_CANDIDATES);
        }
      } catch {
        setCandidates(FALLBACK_CANDIDATES);
      }

      // 3. Fetch Matches List
      try {
        const matchRes = await matchingApi.getMatches();
        setMatches(matchRes.data.data.matches || []);
      } catch {
        /* ignore */
      }
    } catch {
      setCandidates(FALLBACK_CANDIDATES);
    } finally {
      setLoadingDeck(false);
    }
  };

  const handleSwipe = async (action, targetCandidate = null) => {
    const currentList = candidates.length > 0 ? candidates : FALLBACK_CANDIDATES;
    const candidateToSwipe = targetCandidate || currentList[candidateIdx];
    
    if (!candidateToSwipe) return;

    setLikedPartner(null);
    setMatchedPartner(null);

    // Call backend swipe API
    try {
      const swipeRes = await matchingApi.swipe(candidateToSwipe.id, action);
      const resData = swipeRes.data.data;
      
      if (resData && resData.isMatch) {
        // 🎉 MUTUAL MATCH SUCCESS!
        const partner = resData.matchedUser || candidateToSwipe;
        setMatchedPartner(partner);
        setMatches(prev => {
          const exists = prev.some(m => m.id === partner.id);
          return exists ? prev : [partner, ...prev];
        });
        setTimeout(() => setMatchedPartner(null), 3500);
      } else if (action === 'LIKE' || action === 'SUPER_LIKE') {
        // 💖 STANDARD LIKE SENT
        const partner = resData?.likedUser || candidateToSwipe;
        setLikedPartner(partner);
        setTimeout(() => setLikedPartner(null), 2500);
      }
    } catch {
      // Fallback local simulation (1-2 random matches)
      if (action === 'LIKE' || action === 'SUPER_LIKE') {
        const isRandomMatch = (candidateToSwipe.id === -1 || candidateToSwipe.id === -3 || candidateToSwipe.id === -7);
        if (isRandomMatch) {
          setMatchedPartner(candidateToSwipe);
          setMatches(prev => {
            const exists = prev.some(m => m.id === candidateToSwipe.id);
            return exists ? prev : [candidateToSwipe, ...prev];
          });
          setTimeout(() => setMatchedPartner(null), 3500);
        } else {
          setLikedPartner(candidateToSwipe);
          setTimeout(() => setLikedPartner(null), 2500);
        }
      }
    }

    if (selectedProfile) {
      setSelectedProfile(null);
    }
    setCandidateIdx(prev => prev + 1);
  };

  const testAdminRoute = async () => {
    setAdminError('');
    setAdminData(null);
    setAdminLoading(true);
    try {
      const res = await adminApi.stats();
      setAdminData(res.data.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) setAdminError('403 Forbidden — chỉ có ADMIN mới xem được API này.');
      else if (status === 401) setAdminError('401 Unauthorized — token không hợp lệ.');
      else setAdminError(err.response?.data?.error?.message || 'Lỗi yêu cầu');
    } finally { setAdminLoading(false); }
  };

  const openDetailProfile = (person) => {
    setSelectedProfile(person);
    setActivePhotoIdx(0);
  };

  const currentList = candidates.length > 0 ? candidates : FALLBACK_CANDIDATES;
  const currentCandidate = currentList[candidateIdx];
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#0f1115', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── TINDER LEFT SIDEBAR ── */}
      <aside style={{
        width: '340px',
        background: '#181c22',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* User Profile Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fd267d, #ff6036)',
          padding: '1.2rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div
            onClick={() => navigate('/onboarding')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
          >
            <img
              src={profile?.profilePicture || defaultAvatar}
              alt="My Avatar"
              onError={(e) => { e.target.src = defaultAvatar; }}
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{profile?.fullName || user?.username}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Cập nhật Hồ sơ</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: '#fff' }}>
            Đăng xuất
          </button>
        </div>

        {/* Tinder Sidebar Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('matches')}
            style={{
              flex: 1, padding: '1rem', background: 'transparent', border: 'none',
              color: activeTab === 'matches' ? '#fd267d' : 'rgba(255,255,255,0.6)',
              borderBottom: activeTab === 'matches' ? '2px solid #fd267d' : 'none',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
            }}
          >
            Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            style={{
              flex: 1, padding: '1rem', background: 'transparent', border: 'none',
              color: activeTab === 'messages' ? '#fd267d' : 'rgba(255,255,255,0.6)',
              borderBottom: activeTab === 'messages' ? '2px solid #fd267d' : 'none',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
            }}
          >
            Tin nhắn
          </button>
        </div>

        {/* Sidebar Content List */}
        <div style={{ padding: '1.2rem', flex: 1, overflowY: 'auto' }}>
          {activeTab === 'matches' ? (
            matches.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                {matches.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => openDetailProfile(m)}
                    style={{
                      position: 'relative', height: '140px', borderRadius: '12px', overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)', background: '#000', cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                    
                    {/* Unmatch Quick Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnmatch(m.id, m.name); }}
                      title="Hủy ghép đôi (Unmatch)"
                      style={{
                        position: 'absolute', top: '6px', right: '6px', zIndex: 10,
                        background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,68,88,0.4)',
                        color: '#ff4458', borderRadius: '50%', width: '26px', height: '26px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.78rem'
                      }}
                    >
                      💔
                    </button>

                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                      {m.name}, {m.age}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '3rem' }}>
                <p style={{ fontSize: '0.9rem' }}>Chưa có lượt Match nào.<br />Bắt đầu quẹt thẻ bên phải để tìm đối phương!</p>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '3rem' }}>
              <p style={{ fontSize: '0.9rem' }}>Tin nhắn trò chuyện sẽ hiển thị khi bạn và đối phương cùng Match nhau.</p>
            </div>
          )}

          {/* Admin Demo Panel */}
          <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
              🛡 RBAC Demo — Admin Route
            </div>
            <button className="btn btn-primary btn-sm" onClick={testAdminRoute} disabled={adminLoading} style={{ width: '100%', fontSize: '0.8rem' }}>
              {adminLoading ? 'Đang test...' : 'Test Admin API Stats'}
            </button>
            {adminError && <div style={{ fontSize: '0.78rem', color: '#ff4b4b', marginTop: '0.5rem' }}>{adminError}</div>}
            {adminData && <div style={{ fontSize: '0.78rem', color: '#20d5ec', marginTop: '0.5rem' }}>✓ 200 OK — Admin granted!</div>}
          </div>
        </div>
      </aside>

      {/* ── TINDER MAIN SWIPING STAGE (CENTER) ── */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: '2rem'
      }}>
        
        {/* 🌟 1. PROMINENT MUTUAL MATCH BANNER */}
        {matchedPartner && (
          <div style={{
            position: 'absolute', top: '2rem', zIndex: 100,
            background: 'linear-gradient(135deg, #fd267d, #ff6036)',
            padding: '1.1rem 2.2rem', borderRadius: '30px', fontWeight: 800, fontSize: '1.25rem',
            boxShadow: '0 10px 35px rgba(253,38,125,0.7)', border: '2px solid rgba(255,255,255,0.4)',
            textAlign: 'center', color: '#fff'
          }}>
            Match thành công, bạn và {matchedPartner.name} đã thích nhau! 🎉
          </div>
        )}

        {/* 💖 2. STANDARD LIKE BANNER */}
        {likedPartner && !matchedPartner && (
          <div style={{
            position: 'absolute', top: '2rem', zIndex: 100,
            background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff',
            padding: '0.8rem 1.8rem', borderRadius: '24px', fontWeight: 600, fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            💖 Bạn đã thích {likedPartner.name}!
          </div>
        )}

        {/* 💔 3. UNMATCHED NOTICE BANNER */}
        {unmatchedNotice && (
          <div style={{
            position: 'absolute', top: '2rem', zIndex: 100,
            background: 'rgba(255, 68, 88, 0.15)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 68, 88, 0.4)', color: '#ff4458',
            padding: '0.8rem 1.8rem', borderRadius: '24px', fontWeight: 700, fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(255, 68, 88, 0.3)'
          }}>
            {unmatchedNotice}
          </div>
        )}

        {/* TINDER SWIPE CARD OR EXHAUSTED DECK NOTICE */}
        {loadingDeck ? (
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Đang tìm kiếm đối tượng ghép đôi...</p>
          </div>
        ) : (!currentCandidate || candidateIdx >= currentList.length) ? (
          /* 🌟 EXHAUSTED DECK NOTIFICATION SCREEN */
          <div style={{
            width: '380px', minHeight: '460px', borderRadius: '24px', padding: '2.5rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(253,38,125,0.12)',
              border: '2px solid rgba(253,38,125,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', marginBottom: '1.2rem'
            }}>
              🌟
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.6rem', color: '#fff', lineHeight: '1.4' }}>
              Hôm nay bạn đã sử dụng hết lượt xem hồ sơ, hãy quay lại vào ngày mai
            </h2>

            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '1.8rem', maxWidth: '300px' }}>
              Nâng cấp tài khoản để gặp gỡ nhiều bạn mới và nâng cao trải nghiệm
            </p>

            <button
              onClick={() => checkProfileAndLoadData()}
              className="btn btn-primary"
              style={{ padding: '0.8rem 1.8rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}
            >
              🔄 Tải lại tìm kiếm
            </button>
          </div>
        ) : (
          <>
            {/* Candidate Card (Click to open full profile) */}
            <div
              onClick={() => openDetailProfile(currentCandidate)}
              title="Click để xem Hồ sơ chi tiết"
              style={{
                width: '380px', height: '560px', borderRadius: '16px', overflow: 'hidden',
                position: 'relative', background: '#000', boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'transform 0.3s ease'
              }}
            >
              <img
                src={currentCandidate.photo}
                alt={currentCandidate.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)',
                pointerEvents: 'none'
              }} />

              {/* Click Info Hint Badge */}
              <div style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff',
                padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}>
                ℹ️ Xem chi tiết
              </div>

              {/* Candidate Info Overlay */}
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>{currentCandidate.name}</span>
                  <span style={{ fontSize: '1.7rem', fontWeight: 400 }}>{currentCandidate.age}</span>
                  <span style={{ color: '#20d5ec', fontSize: '1.3rem' }}>✓</span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.3rem' }}>
                  {currentCandidate.location}
                </div>

                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.6rem', lineHeight: '1.4' }}>
                  {currentCandidate.bio}
                </p>

                {Array.isArray(currentCandidate.tags) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.8rem' }}>
                    {currentCandidate.tags.map((tag, i) => (
                      <span key={i} style={{
                        background: 'rgba(255,255,255,0.2)', color: '#fff',
                        borderRadius: '14px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', backdropFilter: 'blur(4px)'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ACTION CONTROL BUTTONS BAR (2 EQUAL-SIZED CIRCULAR BUTTONS) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginTop: '1.8rem' }}>
              
              {/* Pass (Quẹt trái - ❌) */}
              <button
                onClick={() => handleSwipe('PASS')}
                title="Bỏ qua (Pass)"
                className="tinder-btn-action tinder-btn-pass"
                style={{
                  width: '72px', height: '72px', borderRadius: '50%', background: '#181c22',
                  border: '2px solid #ff4458', color: '#ff4458', fontSize: '2rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(255, 68, 88, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                ✕
              </button>

              {/* Like (Quẹt phải - 💖) */}
              <button
                onClick={() => handleSwipe('LIKE')}
                title="Thích (Like)"
                className="tinder-btn-action tinder-btn-like"
                style={{
                  width: '72px', height: '72px', borderRadius: '50%', background: '#181c22',
                  border: '2px solid #34D399', color: '#34D399', fontSize: '2rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(52, 211, 153, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                💖
              </button>

            </div>
          </>
        )}

      </main>

      {/* ── 🌟 DETAILED FULL-SCREEN / MODAL CANDIDATE PROFILE VIEW ── */}
      {selectedProfile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
            background: '#181c22', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 70px rgba(0,0,0,0.8)', position: 'relative', display: 'flex', flexDirection: 'column'
          }}>
            
            {/* Top Bar with Return / Close Button */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 30, background: 'rgba(24, 28, 34, 0.95)',
              backdropFilter: 'blur(10px)', padding: '1rem 1.2rem', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <button
                onClick={() => setSelectedProfile(null)}
                className="btn btn-ghost"
                style={{ width: 'auto', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.88rem' }}
              >
                ← Quay lại
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Hồ sơ của {selectedProfile.name}</span>
              <button
                onClick={() => setSelectedProfile(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Photo Gallery Viewer */}
            <div style={{ position: 'relative', width: '100%', height: '420px', background: '#000' }}>
              <img
                src={
                  Array.isArray(selectedProfile.photos) && selectedProfile.photos.length > 0
                    ? selectedProfile.photos[activePhotoIdx] || selectedProfile.photo
                    : selectedProfile.photo
                }
                alt={selectedProfile.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Photo Navigation Indicators / Dots */}
              {Array.isArray(selectedProfile.photos) && selectedProfile.photos.length > 1 && (
                <div style={{
                  position: 'absolute', top: '1rem', left: '1rem', right: '1rem',
                  display: 'flex', gap: '6px', zIndex: 10
                }}>
                  {selectedProfile.photos.map((_, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setActivePhotoIdx(pIdx)}
                      style={{
                        flex: 1, height: '4px', borderRadius: '2px', cursor: 'pointer',
                        background: activePhotoIdx === pIdx ? '#FF2D55' : 'rgba(255,255,255,0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Selection Strip */}
            {Array.isArray(selectedProfile.photos) && selectedProfile.photos.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.8rem 1.2rem', background: '#12151a' }}>
                {selectedProfile.photos.map((pUrl, pIdx) => (
                  <img
                    key={pIdx}
                    src={pUrl}
                    alt="Thumb"
                    onClick={() => setActivePhotoIdx(pIdx)}
                    style={{
                      width: '55px', height: '55px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer',
                      border: activePhotoIdx === pIdx ? '2px solid #FF2D55' : '1px solid rgba(255,255,255,0.1)',
                      opacity: activePhotoIdx === pIdx ? 1 : 0.6, transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Detailed Profile Info Section */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{selectedProfile.name}</h2>
                    <span style={{ fontSize: '1.5rem', fontWeight: 400 }}>{selectedProfile.age}</span>
                    <span style={{ color: '#20d5ec', fontSize: '1.2rem' }}>✓</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.3rem' }}>
                    📍 {selectedProfile.location}
                  </div>
                </div>
                {selectedProfile.height && (
                  <div style={{
                    background: 'rgba(255,255,255,0.06)', padding: '0.4rem 0.9rem', borderRadius: '12px',
                    fontSize: '0.88rem', fontWeight: 700, color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.2)'
                  }}>
                    📏 {selectedProfile.height} cm
                  </div>
                )}
              </div>

              {/* Bio Section */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Giới thiệu bản thân
                </div>
                <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6', margin: 0 }}>
                  {selectedProfile.bio || 'Chưa thêm bài giới thiệu bản thân.'}
                </p>
              </div>

              {/* Interest Tags */}
              {Array.isArray(selectedProfile.tags) && selectedProfile.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    Sở thích cá nhân
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedProfile.tags.map((tag, i) => (
                      <span key={i} style={{
                        background: 'rgba(253, 38, 125, 0.15)', color: '#FF2D55', border: '1px solid rgba(253, 38, 125, 0.3)',
                        borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.82rem', fontWeight: 600
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* If already matched, show Unmatch button */}
              {matches.some(m => m.id === selectedProfile.id) ? (
                <button
                  onClick={() => handleUnmatch(selectedProfile.id, selectedProfile.name)}
                  className="btn btn-ghost"
                  style={{
                    width: '100%', marginTop: '0.5rem', color: '#ff4458', borderColor: 'rgba(255,68,88,0.4)',
                    background: 'rgba(255,68,88,0.08)', fontWeight: 700, padding: '0.8rem'
                  }}
                >
                  💔 Hủy ghép đôi với {selectedProfile.name}
                </button>
              ) : (
                /* Swiping Action Controls inside Modal */
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => handleSwipe('PASS', selectedProfile)}
                    title="Bỏ qua (Pass)"
                    className="tinder-btn-action tinder-btn-pass"
                    style={{
                      width: '64px', height: '64px', borderRadius: '50%', background: '#181c22',
                      border: '2px solid #ff4458', color: '#ff4458', fontSize: '1.8rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(255, 68, 88, 0.25)',
                    }}
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => handleSwipe('LIKE', selectedProfile)}
                    title="Thích (Like)"
                    className="tinder-btn-action tinder-btn-like"
                    style={{
                      width: '64px', height: '64px', borderRadius: '50%', background: '#181c22',
                      border: '2px solid #34D399', color: '#34D399', fontSize: '1.8rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(52, 211, 153, 0.25)',
                    }}
                  >
                    💖
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
