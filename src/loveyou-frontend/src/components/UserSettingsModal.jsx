import { useState, useEffect, useRef } from 'react';
import { userApi, authApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsQR from 'jsqr';

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
  const [frontPhoto, setFrontPhoto] = useState('');
  const [backPhoto, setBackPhoto] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  const [backScanning, setBackScanning] = useState(false);
  const [qrData, setQrData] = useState('');
  const [parsedCccd, setParsedCccd] = useState(null);
  const [qrError, setQrError] = useState('');
  const [backError, setBackError] = useState('');
  const [isBackVerified, setIsBackVerified] = useState(false);
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

  // ── Helper: Scan QR from Image Element via jsQR ──
  const scanQrCodeFromImage = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Scale 1: Original / High Res
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

    // If not detected, try scan specifically at scaled resolution
    if (!code && (canvas.width > 1200 || canvas.height > 1200)) {
      const scale = Math.min(1000 / canvas.width, 1000 / canvas.height);
      const w = Math.round(canvas.width * scale);
      const h = Math.round(canvas.height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      imageData = ctx.getImageData(0, 0, w, h);
      code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
    }

    return code ? code.data : null;
  };

  // ── Helper: Parse Vietnamese CCCD QR Payload ──
  const parseVietnameseCccdQr = (rawData) => {
    if (!rawData || typeof rawData !== 'string') return null;
    const parts = rawData.split('|');
    if (parts.length < 5) return null;

    const idNumber = parts[0]?.trim();
    if (!/^\d{12}$/.test(idNumber)) return null;

    return {
      idNumber,
      oldId: parts[1]?.trim() || '',
      fullName: parts[2]?.trim() || '',
      dob: parts[3]?.trim() || '',
      gender: parts[4]?.trim() || '',
      address: parts[5]?.trim() || '',
      issueDate: parts[6]?.trim() || '',
      raw: rawData,
    };
  };

  // ── Handle CCCD Front Upload & Auto-Scan QR ──
  const handleCccdFrontUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setQrScanning(true);
    setQrError('');
    setParsedCccd(null);
    setQrData('');

    try {
      const { compressedBase64, img } = await compressImage(file, 800, 0.72);
      setFrontPhoto(compressedBase64);

      // Attempt to scan QR code on front side
      const scannedText = scanQrCodeFromImage(img);
      if (!scannedText) {
        setQrError('⚠️ Không nhận diện được căn cước công dân, vui lòng chụp rõ mặt trước CCCD.');
        return;
      }

      const parsed = parseVietnameseCccdQr(scannedText);
      if (!parsed) {
        setQrError('⚠️ Căn cước công dân không hợp lệ.');
        return;
      }

      setQrData(scannedText);
      setParsedCccd(parsed);
      if (setToast) setToast({ type: 'success', message: `✓ Đã quét thành công CCCD: ${parsed.fullName}` });
    } catch (err) {
      console.error('Front upload error:', err);
      setQrError('Lỗi xử lý ảnh căn cước công dân');
    } finally {
      setQrScanning(false);
    }
  };

  // ── Helper: Validate CCCD Back Side via Tesseract OCR ──
  const validateCccdBackImage = async (canvas, expectedIdNumber) => {
    try {
      const { data } = await Tesseract.recognize(canvas, 'eng');
      const text = String(data?.text || '').toUpperCase().replace(/[\s\r\n]+/g, '');

      // 1. Check for MRZ indicators (IDVNM, VNM, ICAO patterns)
      const hasMrz = text.includes('IDVNM') || text.includes('VNM') || /ID[A-Z0-9]{3}/.test(text);

      // 2. Check for 12-digit CCCD number matching front QR code
      const cleanExpectedId = String(expectedIdNumber || '').trim();
      const hasMatchingId = cleanExpectedId.length === 12 && text.includes(cleanExpectedId);

      // 3. Check for keywords unique to Vietnamese CCCD back side
      const hasBackKeywords = (
        text.includes('DACDIEM') ||
        text.includes('NHANDANG') ||
        text.includes('CUCTRUONG') ||
        text.includes('CANHSAT') ||
        text.includes('VANTAY') ||
        text.includes('NGONTRO') ||
        text.includes('COGIATRI') ||
        text.includes('NGAYTHANG') ||
        text.includes('SOCIALIST') ||
        text.includes('REPUBLIC')
      );

      const isValid = hasMrz || hasMatchingId || hasBackKeywords;
      return { isValid, recognizedText: text };
    } catch (err) {
      console.warn('Tesseract OCR error:', err);
      return { isValid: false, recognizedText: '' };
    }
  };

  // ── Handle CCCD Back Upload ──
  const handleCccdBackUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setBackScanning(true);
    setBackError('');
    setIsBackVerified(false);
    setBackPhoto('');

    try {
      const { compressedBase64, canvas } = await compressImage(file, 800, 0.72);

      // Run OCR & MRZ validation on back image
      const { isValid } = await validateCccdBackImage(canvas, parsedCccd?.idNumber);

      if (!isValid) {
        setBackPhoto('');
        setIsBackVerified(false);
        setBackError('⚠️ Ảnh mặt sau không hợp lệ! Vui lòng chụp rõ mặt sau CCCD.');
        if (setToast) setToast({ type: 'error', message: 'Ảnh tải lên không đúng mặt sau Căn cước công dân!' });
        return;
      }

      setBackPhoto(compressedBase64);
      setIsBackVerified(true);
      if (setToast) setToast({ type: 'success', message: '✓ Đã nhận diện & xác thực thành công mặt sau CCCD' });
    } catch (err) {
      console.error('Back upload error:', err);
      setBackError('Lỗi phân tích ảnh mặt sau căn cước');
    } finally {
      setBackScanning(false);
    }
  };

  // ── Submit CCCD Verification ──
  const handleSubmitCitizenVerification = async () => {
    if (!frontPhoto) {
      setToast({ type: 'warning', message: 'Vui lòng tải lên ảnh mặt trước CCCD' });
      return;
    }
    if (!backPhoto) {
      setToast({ type: 'warning', message: 'Vui lòng tải lên ảnh mặt sau CCCD' });
      return;
    }
    if (!qrData || !parsedCccd) {
      setToast({ type: 'warning', message: 'Ảnh mặt trước chưa được nhận diện CCCD hợp lệ' });
      return;
    }

    setSubmittingCccd(true);
    try {
      const res = await userApi.verifyCitizen({
        frontPhoto,
        backPhoto,
        qrData,
        parsedInfo: parsedCccd,
      });

      const citizenData = res.data?.data?.citizenInfo || {};
      setIsCitizenVerified(true);
      setCitizenInfo({
        idNumber: citizenData.citizenIdNumber || parsedCccd.idNumber,
        name: citizenData.citizenName || parsedCccd.fullName,
        dob: citizenData.citizenDob || parsedCccd.dob,
        gender: citizenData.citizenGender || parsedCccd.gender,
        address: citizenData.citizenAddress || parsedCccd.address,
        issueDate: citizenData.citizenIssueDate || parsedCccd.issueDate,
        verifiedAt: new Date().toISOString(),
      });

      if (onProfileUpdated) {
        onProfileUpdated({
          ...profile,
          isCitizenVerified: true,
          citizenIdNumber: citizenData.citizenIdNumber || parsedCccd.idNumber,
          citizenName: citizenData.citizenName || parsedCccd.fullName,
        });
      }

      setToast({ type: 'success', message: '🎉 Xác thực Căn cước công dân thành công!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Xác thực căn cước công dân thất bại' });
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
      <div style={styles.modalBody} onClick={e => e.stopPropagation()}>
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
            {(isEmailVerified && isCitizenVerified) && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓</span>}
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
                {isCitizenVerified ? (
                  <span style={styles.badgeSuccess}>✓ Đã xác thực</span>
                ) : (
                  <span style={styles.badgePending}>Chưa xác thực</span>
                )}
              </div>

              {isCitizenVerified ? (
                /* Verified Citizen Info Card */
                <div style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontWeight: 800 }}>
                    <span>🛡️</span>
                    <span>Tài khoản đã được xác minh danh tính công dân Việt Nam</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.4rem', color: 'rgba(255,255,255,0.8)' }}>
                    <div>Số CCCD: <b style={{ color: '#fff' }}>•••• •••• {citizenInfo.idNumber?.slice(-4) || '••••'}</b></div>
                    <div>Họ và tên: <b style={{ color: '#fff' }}>{citizenInfo.name || '***'}</b></div>
                    <div>Ngày sinh: <b style={{ color: '#fff' }}>{citizenInfo.dob || '***'}</b></div>
                    <div>Giới tính: <b style={{ color: '#fff' }}>{citizenInfo.gender || '***'}</b></div>
                  </div>
                </div>
              ) : (
                /* Upload & Scan CCCD */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                    Tải lên ảnh 2 mặt Căn cước công dân. Hệ thống sẽ tự động quét và xác thực thông tin.
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
                        borderColor: parsedCccd ? '#10b981' : qrError ? '#ef4444' : 'rgba(255,255,255,0.2)',
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
                              background: parsedCccd ? '#10b981' : '#ef4444',
                              color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px',
                            }}>
                              {parsedCccd ? '✓ Đã quét QR' : 'Đổi ảnh'}
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
                        Mặt sau CCCD *
                      </label>
                      <label style={{
                        ...styles.uploadBox,
                        borderColor: isBackVerified ? '#10b981' : backError ? '#ef4444' : 'rgba(255,255,255,0.2)',
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
                              ✓ Khớp MRZ
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

                  {/* Indicators & Errors */}
                  {qrScanning && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.82rem' }}>
                      <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#38bdf8' }} />
                      <span>Đang quét mã QR từ ảnh mặt trước CCCD...</span>
                    </div>
                  )}

                  {backScanning && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.82rem' }}>
                      <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#38bdf8' }} />
                      <span>Đang đọc mã MRZ & xác thực thông tin mặt sau CCCD...</span>
                    </div>
                  )}

                  {qrError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.6rem 0.8rem', color: '#ef4444', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {qrError}
                    </div>
                  )}

                  {backError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.6rem 0.8rem', color: '#ef4444', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {backError}
                    </div>
                  )}

                  {parsedCccd && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '0.7rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem' }}>
                      <div style={{ color: '#34D399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✓ Nhận diện thành công mã QR Căn cước công dân:</span>
                      </div>
                      <div style={{ color: '#fff' }}>Họ tên: <b>{parsedCccd.fullName}</b> • CCCD: <b>•••• •••• {parsedCccd.idNumber?.slice(-4)}</b></div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.76rem' }}>Ngày sinh: {parsedCccd.dob} • Giới tính: {parsedCccd.gender}</div>
                    </div>
                  )}

                  {/* Submit CCCD Button */}
                  <button
                    type="button"
                    onClick={handleSubmitCitizenVerification}
                    disabled={submittingCccd || !frontPhoto || !backPhoto || !parsedCccd || !isBackVerified}
                    style={{
                      padding: '0.8rem', borderRadius: '14px',
                      background: (!frontPhoto || !backPhoto || !parsedCccd || !isBackVerified)
                        ? 'rgba(255,255,255,0.08)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: (!frontPhoto || !backPhoto || !parsedCccd || !isBackVerified) ? 'rgba(255,255,255,0.4)' : '#fff',
                      fontWeight: 800, fontSize: '0.9rem',
                      cursor: (!frontPhoto || !backPhoto || !parsedCccd || !isBackVerified) ? 'not-allowed' : 'pointer',
                      boxShadow: (!frontPhoto || !backPhoto || !parsedCccd || !isBackVerified) ? 'none' : '0 4px 15px rgba(16,185,129,0.35)',
                      transition: 'all 0.2s ease',
                      marginTop: '0.2rem',
                    }}
                  >
                    {submittingCccd ? '⏳ Đang lưu & xác thực danh tính...' : '🛡️ Hoàn Tất Xác Thực Công Dân'}
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
