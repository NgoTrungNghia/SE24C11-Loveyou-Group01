import { useState, useEffect } from 'react';
import { userApi, authApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function UserSettingsModal({ profile, onProfileUpdated, onClose, setToast }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE', 'BLOCKED', 'PASSWORD'

  // Profile Form state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [height, setHeight] = useState(profile?.height || '');
  const [gender, setGender] = useState(profile?.gender || 'Nam');
  const [profilePicture, setProfilePicture] = useState(profile?.profilePicture || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch blocked users when BLOCKED tab is active
  useEffect(() => {
    if (activeTab === 'BLOCKED') {
      loadBlockedUsers();
    }
  }, [activeTab]);

  const loadBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await userApi.getBlockedUsers();
      setBlockedUsers(res.data?.data?.blockedUsers || []);
    } catch (err) {
      console.error('loadBlockedUsers error:', err);
      setBlockedUsers([]);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (targetId) => {
    setUnblockingId(targetId);
    try {
      await userApi.unblockUser(targetId);
      setToast({ type: 'success', message: 'Đã bỏ chặn tài khoản thành công!' });
      setBlockedUsers(prev => prev.filter(b => b.user?.userId !== targetId));
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Thao tác bỏ chặn thất bại' });
    } finally {
      setUnblockingId(null);
    }
  };

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setProfilePicture(compressedDataUrl);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await userApi.updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        height: height ? Number(height) : null,
        gender,
        profilePicture: profilePicture.trim(),
      });
      const updatedUser = res.data.data.profile;
      if (onProfileUpdated) onProfileUpdated(updatedUser);
      setToast({ type: 'success', message: 'Đã cập nhật hồ sơ thành công!' });
      onClose();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể cập nhật hồ sơ' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setToast({ type: 'warning', message: 'Vui lòng nhập mật khẩu hiện tại' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setToast({ type: 'warning', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'warning', message: 'Xác nhận mật khẩu mới không khớp' });
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setToast({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể đổi mật khẩu' });
    } finally {
      setChangingPassword(false);
    }
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalBody} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>⚙️ Cài Đặt Hệ Thống</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 3 Main Navigation Buttons */}
        <div style={styles.tabsGrid}>
          <button
            onClick={() => setActiveTab('PROFILE')}
            style={{
              ...styles.tabBtn,
              background: activeTab === 'PROFILE' ? 'linear-gradient(135deg, #fd267d, #ff6036)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              boxShadow: activeTab === 'PROFILE' ? '0 4px 15px rgba(253,38,125,0.35)' : 'none',
            }}
          >
            Chỉnh sửa hồ sơ
          </button>

          <button
            onClick={() => setActiveTab('BLOCKED')}
            style={{
              ...styles.tabBtn,
              background: activeTab === 'BLOCKED' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              boxShadow: activeTab === 'BLOCKED' ? '0 4px 15px rgba(245,158,11,0.35)' : 'none',
            }}
          >
            Tài khoản đã chặn
          </button>

          <button
            onClick={() => setActiveTab('PASSWORD')}
            style={{
              ...styles.tabBtn,
              background: activeTab === 'PASSWORD' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              boxShadow: activeTab === 'PASSWORD' ? '0 4px 15px rgba(59,130,246,0.35)' : 'none',
            }}
          >
            Đổi mật khẩu
          </button>
        </div>

        {/* TAB 1: CHỈNH SỬA HỒ SƠ */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} style={styles.form}>
            
            {/* Interactive Circular Avatar Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.8rem' }}>
              <label htmlFor="user-avatar-file-input" className={profile?.isVip ? 'vip-avatar-glow' : ''} style={{ position: 'relative', cursor: 'pointer' }}>
                <img
                  src={profilePicture || defaultAvatar}
                  alt="Avatar"
                  onError={e => { e.target.src = defaultAvatar; }}
                  style={{
                    width: '94px',
                    height: '94px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: profile?.isVip ? 'none' : '3px solid #fd267d',
                    boxShadow: profile?.isVip ? 'none' : '0 6px 20px rgba(253,38,125,0.4)',
                    transition: 'all 0.2s ease',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: '#fd267d',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  border: '2px solid #16191f',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}>
                  📷
                </div>
              </label>
              <input
                id="user-avatar-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFileUpload}
              />
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                Nhấp vào ảnh đại diện để chọn ảnh từ thiết bị
              </span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tên hiển thị</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nhập tên hiển thị..."
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tiểu sử giới thiệu</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Viết một chút về bản thân bạn..."
                style={{ ...styles.input, resize: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Vị trí</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="TP. Hồ Chí Minh"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Chiều cao (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="168"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Giới tính</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  style={{ ...styles.input, cursor: 'pointer' }}
                >
                  <option value="Nam" style={{ background: '#1e232a', color: '#fff' }}>Nam</option>
                  <option value="Nữ" style={{ background: '#1e232a', color: '#fff' }}>Nữ</option>
                  <option value="Khác" style={{ background: '#1e232a', color: '#fff' }}>Khác</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/onboarding');
                }}
                style={{ background: 'transparent', border: 'none', color: '#fd267d', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'underline' }}
              >
                Mở trang chỉnh sửa chi tiết (ảnh & sở thích) ➔
              </button>
            </div>

            <div style={styles.actionsFooter}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>Hủy</button>
              <button type="submit" disabled={updatingProfile} style={styles.submitBtn}>
                {updatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: TÀI KHOẢN ĐÃ CHẶN */}
        {activeTab === 'BLOCKED' && (
          <div style={{ minHeight: '220px' }}>
            {loadingBlocked ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>
                Đang tải...
              </div>
            ) : blockedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '0.95rem' }}>
                Danh sách trống
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {blockedUsers.map(b => (
                  <div
                    key={b.blockId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.9rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <img
                        src={b.user?.profilePicture || defaultAvatar}
                        alt=""
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                        {b.user?.fullName || b.user?.username || `Tài khoản #${b.user?.userId}`}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnblock(b.user?.userId)}
                      disabled={unblockingId === b.user?.userId}
                      style={{
                        padding: '5px 12px', borderRadius: '8px',
                        background: '#10b981', border: 'none', color: '#fff',
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                        whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                      }}
                    >
                      {unblockingId === b.user?.userId ? 'Đang bỏ chặn...' : 'Bỏ chặn'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ĐỔI MẬT KHẨU */}
        {activeTab === 'PASSWORD' && (
          <form onSubmit={handleChangePassword} style={styles.form}>
            {/* Mật khẩu cũ */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Mật khẩu hiện tại</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang sử dụng..."
                  style={{ ...styles.input, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(prev => !prev)}
                  style={styles.eyeBtn}
                  title={showCurrentPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showCurrentPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  style={{ ...styles.input, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(prev => !prev)}
                  style={styles.eyeBtn}
                  title={showNewPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showNewPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Xác nhận mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  style={{ ...styles.input, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(prev => !prev)}
                  style={styles.eyeBtn}
                  title={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={styles.actionsFooter}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>Hủy</button>
              <button type="submit" disabled={changingPassword} style={styles.submitBlueBtn}>
                {changingPassword ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.78)',
    backdropFilter: 'blur(10px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  modalBody: {
    background: '#16191f',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '24px',
    padding: '2rem',
    width: '100%',
    maxWidth: '540px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#fff',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
  tabsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.6rem',
    marginBottom: '1.5rem',
  },
  tabBtn: {
    padding: '0.75rem 0.5rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '4px',
    opacity: 0.8,
  },
  actionsFooter: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '0.8rem',
  },
  cancelBtn: {
    padding: '0.75rem 1.4rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '0.75rem 1.4rem',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #fd267d, #ff6036)',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(253,38,125,0.3)',
  },
  submitBlueBtn: {
    padding: '0.75rem 1.4rem',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
  },
};
