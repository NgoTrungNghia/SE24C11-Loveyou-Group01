import { useState, useEffect, useRef } from 'react';
import { userApi, authApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge, { isFullyVerified } from './VerifiedBadge';

const normalizeGender = (g) => {
  if (!g) return 'Nam';
  const s = String(g).toLowerCase().trim();
  if (s === 'female' || s === 'nữ' || s === 'nu' || s === 'f') return 'Nữ';
  if (s === 'other' || s === 'khác' || s === 'khac') return 'Khác';
  if (s === 'male' || s === 'nam' || s === 'm') return 'Nam';
  return 'Khác';
};

const getDefaultAvatar = (gender) => {
  const g = String(gender || '').toUpperCase();
  if (g === 'FEMALE' || g === 'NỮ' || g === 'NU') {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300';
  }
  if (g === 'OTHER' || g === 'KHÁC' || g === 'KHAC') {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
  }
  return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300';
};

export default function UserSettingsModal({ profile, onProfileUpdated, onLogout, onClose, setToast }) {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE', 'VERIFICATION', 'BLOCKED', 'PASSWORD'

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else if (authLogout) {
      authLogout();
    }
    onClose();
  };

  // Profile Form state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [height, setHeight] = useState(profile?.height || '');
  const [gender, setGender] = useState(() => normalizeGender(profile?.gender));
  const [profilePicture, setProfilePicture] = useState(profile?.profilePicture || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setHeight(profile.height || '');
      setGender(normalizeGender(profile.gender));
      setProfilePicture(profile.profilePicture || '');
      setIsEmailVerified(Boolean(profile.isEmailVerified));
      setIsCitizenVerified(Boolean(profile.isCitizenVerified));
      setCitizenVerificationStatus(profile.citizenVerificationStatus || (profile.isCitizenVerified ? 'APPROVED' : (profile.citizenFrontPhoto ? 'PENDING' : 'NONE')));
      setCitizenRejectReason(profile.citizenRejectReason || '');
      setFrontPhoto(profile.citizenFrontPhoto || '');
      setBackPhoto(profile.citizenBackPhoto || '');
      setCitizenInfo({
        idNumber: profile.citizenIdNumber || '',
        name: profile.citizenName || '',
        dob: profile.citizenDob || '',
        gender: profile.citizenGender || '',
        address: profile.citizenAddress || '',
        issueDate: profile.citizenIssueDate || '',
        verifiedAt: profile.citizenVerifiedAt || '',
      });
    }
  }, [profile]);

  // Verification state (Email & CCCD)
  const [isEmailVerified, setIsEmailVerified] = useState(Boolean(profile?.isEmailVerified));
  const [isCitizenVerified, setIsCitizenVerified] = useState(Boolean(profile?.isCitizenVerified));
  const [citizenVerificationStatus, setCitizenVerificationStatus] = useState(profile?.citizenVerificationStatus || (profile?.isCitizenVerified ? 'APPROVED' : (profile?.citizenFrontPhoto ? 'PENDING' : 'NONE')));
  const [citizenRejectReason, setCitizenRejectReason] = useState(profile?.citizenRejectReason || '');
  const [citizenInfo, setCitizenInfo] = useState({
    idNumber: profile?.citizenIdNumber || '',
    name: profile?.citizenName || '',
    dob: profile?.citizenDob || '',
    gender: profile?.citizenGender || '',
    address: profile?.citizenAddress || '',
    issueDate: profile?.citizenIssueDate || '',
    verifiedAt: profile?.citizenVerifiedAt || '',
  });

  // Email verification workflow
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Citizen CCCD workflow
  const [frontPhoto, setFrontPhoto] = useState(profile?.citizenFrontPhoto || '');
  const [backPhoto, setBackPhoto] = useState(profile?.citizenBackPhoto || '');
  const [submittingCccd, setSubmittingCccd] = useState(false);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
    if (!targetId) return;
    setUnblockingId(targetId);
    try {
      await userApi.unblockUser(targetId);
      setToast({ type: 'success', message: 'Đã bỏ chặn tài khoản thành công!' });
      setBlockedUsers(prev => prev.filter(b => {
        const uId = b.blockedUser?.userId || b.user?.userId || b.blocked?.userId || b.blockedId;
        return Number(uId) !== Number(targetId);
      }));
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Thao tác bỏ chặn thất bại' });
    } finally {
      setUnblockingId(null);
    }
  };

  // ── Helper: Compress image to fixed dimensions ──
  const compressImage = (file, maxSize = 750, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve({ compressedBase64, img, canvas });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ── Handle CCCD Front Upload ──
  const handleCccdFrontUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const { compressedBase64 } = await compressImage(file, 1200, 0.85);
      setFrontPhoto(compressedBase64);
      if (setToast) setToast({ type: 'success', message: '✓ Đã tải lên ảnh mặt trước CCCD' });
    } catch (err) {
      console.error('Front upload error:', err);
      if (setToast) setToast({ type: 'error', message: 'Lỗi tải ảnh mặt trước căn cước' });
    }
  };

  // ── Handle CCCD Back Upload ──
  const handleCccdBackUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const { compressedBase64 } = await compressImage(file, 1200, 0.85);
      setBackPhoto(compressedBase64);
      if (setToast) setToast({ type: 'success', message: '✓ Đã tải lên ảnh mặt sau CCCD' });
    } catch (err) {
      console.error('Back upload error:', err);
      if (setToast) setToast({ type: 'error', message: 'Lỗi tải ảnh mặt sau căn cước' });
    }
  };

  // ── Submit CCCD Verification to Admin ──
  const handleSubmitCitizenVerification = async () => {
    if (!frontPhoto) {
      if (setToast) setToast({ type: 'warning', message: 'Vui lòng tải lên ảnh mặt trước CCCD' });
      return;
    }
    if (!backPhoto) {
      if (setToast) setToast({ type: 'warning', message: 'Vui lòng tải lên ảnh mặt sau CCCD' });
      return;
    }

    setSubmittingCccd(true);
    try {
      const res = await userApi.verifyCitizen({
        frontPhoto,
        backPhoto,
      });

      setCitizenVerificationStatus('PENDING');
      setCitizenRejectReason('');
      if (setToast) setToast({ type: 'success', message: '✓ Đã gửi yêu cầu xác thực CCCD! Vui lòng chờ Quản trị viên xét duyệt.' });

      if (onProfileUpdated) {
        onProfileUpdated({
          ...profile,
          citizenFrontPhoto: frontPhoto,
          citizenBackPhoto: backPhoto,
          citizenVerificationStatus: 'PENDING',
          citizenRejectReason: null,
          isCitizenVerified: false,
        });
      }
    } catch (err) {
      if (setToast) setToast({ type: 'error', message: err.response?.data?.error?.message || 'Có lỗi xảy ra khi gửi yêu cầu xác thực' });
    } finally {
      setSubmittingCccd(false);
    }
  };

  // ── Send Email OTP ──
  const handleSendEmailOtp = async () => {
    setSendingEmailOtp(true);
    try {
      const res = await userApi.sendEmailVerification();
      setEmailOtpSent(true);
      setResendCooldown(60); // 60s cooldown
      setToast({ type: 'success', message: res.data?.data?.message || 'Mã xác thực đã được gửi tới email của bạn!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể gửi mã xác thực email' });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // ── Verify Email OTP ──
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.trim().length !== 6) {
      setToast({ type: 'warning', message: 'Vui lòng nhập đúng 6 chữ số mã xác thực' });
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      const res = await userApi.verifyEmail(emailOtp.trim());
      setIsEmailVerified(true);
      setEmailOtp('');
      setEmailOtpSent(false);

      if (onProfileUpdated) {
        onProfileUpdated({
          ...profile,
          isEmailVerified: true,
        });
      }

      setToast({ type: 'success', message: res.data?.data?.message || '🎉 Xác thực email thành công!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Mã xác thực không chính xác hoặc đã hết hạn' });
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const { compressedBase64 } = await compressImage(file, 600, 0.75);
      setProfilePicture(compressedBase64);
    } catch (err) {
      console.error('Avatar upload error:', err);
    }
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
        gender: gender === 'Nữ' ? 'female' : (gender === 'Khác' ? 'other' : 'male'),
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

  const defaultFemaleAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
  const defaultMaleAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400';
  const defaultNeutralAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2394a3b8"><rect width="100" height="100" fill="%23334155"/><circle cx="50" cy="38" r="20" fill="%23cbd5e1"/><path d="M20 85c0-18 14-30 30-30s30 12 30 30" fill="%23cbd5e1"/></svg>';

  const getDefaultAvatar = (gen) => {
    const g = String(gen || '').toUpperCase();
    if (['FEMALE', 'NỮ'].includes(g)) return defaultFemaleAvatar;
    if (['MALE', 'NAM'].includes(g)) return defaultMaleAvatar;
    return defaultNeutralAvatar;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="custom-scrollbar" style={styles.modalBody} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>⚙️ Cài Đặt Hệ Thống</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 4 Main Navigation Tabs */}
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
            Hồ sơ
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATION')}
            style={{
              ...styles.tabBtn,
              background: activeTab === 'VERIFICATION' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              boxShadow: activeTab === 'VERIFICATION' ? '0 4px 15px rgba(16,185,129,0.35)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span>🛡️ Xác thực</span>
            {isFullyVerified({ isEmailVerified, isCitizenVerified, citizenVerificationStatus }) && (
              <VerifiedBadge size={14} />
            )}
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
            Đã chặn
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
            Mật khẩu
          </button>
        </div>

        {/* TAB 1: CHỈNH SỬA HỒ SƠ */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} style={styles.form}>
            {/* Interactive Circular Avatar Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.8rem' }}>
              <label htmlFor="user-avatar-file-input" className={profile?.isVip ? 'vip-avatar-glow' : ''} style={{ position: 'relative', cursor: 'pointer' }}>
                <img
                  src={profilePicture || getDefaultAvatar(gender || profile?.gender)}
                  alt="Avatar"
                  onError={e => { e.target.src = getDefaultAvatar(gender || profile?.gender); }}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.6rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{fullName || profile?.username}</span>
                {isFullyVerified({ isEmailVerified, isCitizenVerified, citizenVerificationStatus }) && (
                  <VerifiedBadge size={18} />
                )}
                {profile?.isVip && (
                  <span className="vip-badge-gradient" style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '8px' }}>👑 VIP</span>
                )}
              </div>
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
                  style={{
                    ...styles.input,
                    cursor: 'pointer',
                    appearance: 'auto',
                    color: '#ffffff',
                    background: '#0f1115',
                  }}
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

        {/* TAB 2: XÁC THỰC TÀI KHOẢN (EMAIL & CCCD) */}
        {activeTab === 'VERIFICATION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

            {/* ── SECTION 1: XÁC THỰC EMAIL ── */}
            <div style={styles.verifyCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>📧</span>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>1. Xác Thực Email</span>
                </div>
                {isEmailVerified ? (
                  <span style={styles.badgeSuccess}>✓ Đã xác thực</span>
                ) : (
                  <span style={styles.badgePending}>Chưa xác thực</span>
                )}
              </div>

              <div style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.8rem' }}>
                Email tài khoản: <b style={{ color: '#fff' }}>{profile?.email || 'Chưa cập nhật'}</b>
              </div>

              {isEmailVerified ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontSize: '0.85rem' }}>
                  <span>🛡️</span>
                  <span>Email này đã được xác minh thành công và được bảo vệ bởi hệ thống LoveYou.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {!emailOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={sendingEmailOtp}
                      style={{
                        padding: '0.75rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none',
                        color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(59,130,246,0.35)',
                      }}
                    >
                      {sendingEmailOtp ? '⏳ Đang gửi mã xác thực...' : '✉️ Gửi Mã Xác Thực Qua Email'}
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="Nhập mã 6 chữ số..."
                          style={{
                            ...styles.input,
                            letterSpacing: '4px',
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: '#FFD700',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={verifyingEmailOtp || emailOtp.length !== 6}
                          style={{
                            padding: '0 1.2rem', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                            color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            opacity: emailOtp.length === 6 ? 1 : 0.6,
                          }}
                        >
                          {verifyingEmailOtp ? 'Đang xác minh...' : 'Xác nhận'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Kiểm tra hộp thư đến hoặc thư rác/spam</span>
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || sendingEmailOtp}
                          onClick={handleSendEmailOtp}
                          style={{
                            background: 'transparent', border: 'none', color: resendCooldown > 0 ? 'rgba(255,255,255,0.4)' : '#3b82f6',
                            cursor: resendCooldown > 0 ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'underline',
                          }}
                        >
                          {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 2: XÁC THỰC CÔNG DÂN (CCCD) ── */}
            <div style={styles.verifyCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🪪</span>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>2. Xác Thực Công Dân (CCCD)</span>
                </div>
                {isCitizenVerified || citizenVerificationStatus === 'APPROVED' ? (
                  <span style={styles.badgeSuccess}>✓ Đã xác thực</span>
                ) : citizenVerificationStatus === 'PENDING' ? (
                  <span style={{ ...styles.badgePending, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    ⏳ Chờ duyệt
                  </span>
                ) : citizenVerificationStatus === 'REJECTED' ? (
                  <span style={{ ...styles.badgePending, background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    ✕ Bị từ chối
                  </span>
                ) : (
                  <span style={styles.badgePending}>Chưa xác thực</span>
                )}
              </div>

              {isCitizenVerified || citizenVerificationStatus === 'APPROVED' ? (
                /* Verified Citizen Info Card */
                <div style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '16px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 800, fontSize: '0.92rem' }}>
                    <span>🛡️</span>
                    <span>Tài khoản đã được Quản trị viên xác minh danh tính Căn cước công dân thành công!</span>
                  </div>

                </div>
              ) : citizenVerificationStatus === 'PENDING' ? (
                /* Pending Approval Card */
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '16px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: 800, fontSize: '0.92rem' }}>
                    <span>⏳</span>
                    <span>Yêu cầu xác thực đang chờ Quản trị viên phê duyệt</span>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Bạn đã gửi ảnh 2 mặt CCCD lên hệ thống. Quản trị viên sẽ kiểm tra và phê duyệt hồ sơ trong thời gian sớm nhất.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.2rem' }}>
                    {frontPhoto && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Ảnh mặt trước:</div>
                        <img src={frontPhoto} alt="Mặt trước" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    )}
                    {backPhoto && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Ảnh mặt sau:</div>
                        <img src={backPhoto} alt="Mặt sau" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setCitizenVerificationStatus('NONE')}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Tải lại ảnh khác
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload CCCD Form (NONE or REJECTED) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {citizenVerificationStatus === 'REJECTED' && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '12px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                    }}>
                      <div style={{ color: '#EF4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                        <span>⚠️</span>
                        <span>Xác thực CCCD thất bại!</span>
                      </div>
                      <div style={{ color: '#FCA5A5', fontSize: '0.82rem' }}>
                        Lý do: <b>{citizenRejectReason || 'Ảnh chụp không rõ ràng hoặc không hợp lệ.'}</b>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
                        Vui lòng chụp lại 2 mặt Căn cước công dân rõ nét và gửi lại yêu cầu bên dưới.
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                    Tải lên ảnh chụp 2 mặt Căn cước công dân của bạn để gửi Quản trị viên xét duyệt:
                  </p>

                  {/* 2-Side Upload Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {/* Mặt trước */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                        Mặt trước *
                      </label>
                      <label style={{
                        ...styles.uploadBox,
                        borderColor: frontPhoto ? '#10b981' : 'rgba(255,255,255,0.2)',
                        background: frontPhoto ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.03)',
                      }}>
                        {frontPhoto ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <img
                              src={frontPhoto}
                              alt="Mặt trước CCCD"
                              style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '10px' }}
                            />
                            <div style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: '#10b981',
                              color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px',
                            }}>
                              Đổi ảnh
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '0.8rem' }}>
                            <div style={{ fontSize: '1.8rem', marginBottom: '2px' }}>📷</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Tải ảnh mặt trước</div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleCccdFrontUpload}
                        />
                      </label>
                    </div>

                    {/* Mặt sau */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                        Mặt sau *
                      </label>
                      <label style={{
                        ...styles.uploadBox,
                        borderColor: backPhoto ? '#10b981' : 'rgba(255,255,255,0.2)',
                        background: backPhoto ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.03)',
                      }}>
                        {backPhoto ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <img
                              src={backPhoto}
                              alt="Mặt sau CCCD"
                              style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '10px' }}
                            />
                            <div style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: '#10b981',
                              color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px',
                            }}>
                              Đổi ảnh
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '0.8rem' }}>
                            <div style={{ fontSize: '1.8rem', marginBottom: '2px' }}>📷</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Tải ảnh mặt sau</div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleCccdBackUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Submit CCCD Button */}
                  <button
                    type="button"
                    onClick={handleSubmitCitizenVerification}
                    disabled={submittingCccd || !frontPhoto || !backPhoto}
                    style={{
                      padding: '0.8rem', borderRadius: '14px',
                      background: (!frontPhoto || !backPhoto)
                        ? 'rgba(255,255,255,0.08)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: (!frontPhoto || !backPhoto) ? 'rgba(255,255,255,0.4)' : '#fff',
                      fontWeight: 800, fontSize: '0.9rem',
                      cursor: (!frontPhoto || !backPhoto) ? 'not-allowed' : 'pointer',
                      boxShadow: (!frontPhoto || !backPhoto) ? 'none' : '0 4px 15px rgba(16,185,129,0.35)',
                      transition: 'all 0.2s ease',
                      marginTop: '0.2rem',
                    }}
                  >
                    {submittingCccd ? '⏳ Đang gửi yêu cầu xác thực...' : '🛡️ Gửi Yêu Cầu Xác Thực CCCD'}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: TÀI KHOẢN ĐÃ CHẶN */}
        {activeTab === 'BLOCKED' && (
          <div style={{ minHeight: '220px' }}>
            {loadingBlocked ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>
                ⏳ Đang tải danh sách chặn...
              </div>
            ) : blockedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '0.95rem' }}>
                🕊️ Bạn chưa chặn tài khoản nào
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {blockedUsers.map(b => {
                  const userObj = b.blockedUser || b.user || b.blocked || {};
                  const targetId = userObj.userId || userObj.id || b.blockedId;
                  const name = userObj.fullName || userObj.username || `Tài khoản #${targetId}`;
                  const avatar = userObj.profilePicture || getDefaultAvatar(userObj.gender);

                  return (
                    <div
                      key={b.blockId || targetId}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.7rem 0.9rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <img
                          src={avatar}
                          alt=""
                          onError={e => { e.target.src = getDefaultAvatar('OTHER'); }}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                            {name}
                          </div>
                          {b.createdAt && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                              Đã chặn ngày {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnblock(targetId)}
                        disabled={unblockingId === targetId}
                        style={{
                          padding: '6px 14px', borderRadius: '8px',
                          background: '#10b981', border: 'none', color: '#fff',
                          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                          whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {unblockingId === targetId ? 'Đang bỏ chặn...' : '🔓 Bỏ chặn'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ĐỔI MẬT KHẨU */}
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

        {/* LOGOUT BUTTON AT THE VERY BOTTOM */}
        <div style={{ marginTop: '1.6rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            🚪 Đăng xuất khỏi tài khoản
          </button>
        </div>
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
    maxWidth: '560px',
    maxHeight: '92vh',
    overflowY: 'auto',
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
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  tabBtn: {
    padding: '0.7rem 0.3rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  verifyCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '18px',
    padding: '1.2rem',
  },
  badgeSuccess: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.5)',
    color: '#34D399',
    fontSize: '0.75rem',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: '20px',
  },
  badgePending: {
    background: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid rgba(245, 158, 11, 0.5)',
    color: '#FBBF24',
    fontSize: '0.75rem',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: '20px',
  },
  uploadBox: {
    height: '90px',
    border: '2px dashed rgba(255,255,255,0.2)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
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
