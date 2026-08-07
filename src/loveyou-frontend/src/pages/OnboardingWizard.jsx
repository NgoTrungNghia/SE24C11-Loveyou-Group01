import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../utils/api';
import { Field } from '../components/shared';

const PRESET_INTERESTS = [
  '🎵 Music', '☕ Coffee', '✈️ Travel', '🏋️ Gym', '🎮 Gaming', 
  '📚 Books', '🍳 Cooking', '🎬 Movies', '🐱 Pets', '🎨 Art', 
  '💻 Coding', '⚽ Sports', '🍷 Wine', '📸 Photography', '🧘 Yoga'
];

export default function OnboardingWizard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1, 2, 3
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    gender: 'MALE',
    dateOfBirth: '',
    profilePicture: '',
    bio: '',
    height: '',
    location: '',
    interests: [],
    photos: ['', '', '', '', ''],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await userApi.getProfile();
      const p = res.data.data.profile;
      if (p) {
        const existingPhotos = Array.isArray(p.photos) ? p.photos : [];
        const photosArray = [0, 1, 2, 3, 4].map(i => existingPhotos[i] || '');
        setForm({
          fullName: p.fullName || '',
          phoneNumber: p.phoneNumber || '',
          gender: p.gender || 'MALE',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          profilePicture: p.profilePicture || '',
          bio: p.bio || '',
          height: p.height || '',
          location: p.location || '',
          interests: Array.isArray(p.interests) ? p.interests : [],
          photos: photosArray,
        });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  // Calculate Real-time 0% to 100% Profile Completion Percentage
  const calculateCompletion = () => {
    let score = 0;
    if (form.fullName && form.fullName.trim()) score += 15;
    if (form.gender && form.dateOfBirth) score += 15;
    if (form.location) score += 15;
    if (form.bio && form.bio.trim().length >= 5) score += 20;
    if (form.interests && form.interests.length >= 3) score += 15;
    const hasPhoto = form.photos.some(p => p && p.trim() !== '') || form.profilePicture;
    if (hasPhoto) score += 20;
    return score > 100 ? 100 : score;
  };

  const toggleInterest = (tag) => {
    setForm(prev => {
      const exists = prev.interests.includes(tag);
      if (exists) {
        return { ...prev, interests: prev.interests.filter(i => i !== tag) };
      } else {
        return { ...prev, interests: [...prev.interests, tag] };
      }
    });
  };

  const handlePhotoChange = (index, value) => {
    setForm(prev => {
      const updatedPhotos = [...prev.photos];
      updatedPhotos[index] = value;
      return { ...prev, photos: updatedPhotos };
    });
  };

  const saveProfileData = async (isFinal = false) => {
    setSaving(true);
    setError('');
    try {
      const cleanedPhotos = form.photos.filter(p => p && p.trim() !== '');
      const payload = {
        ...form,
        height: form.height ? Number(form.height) : null,
        photos: cleanedPhotos,
        profilePicture: cleanedPhotos[0] || form.profilePicture || '',
        isProfileComplete: isFinal ? true : false,
      };

      await userApi.updateProfile(payload);
      if (isFinal) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Lỗi khi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.fullName.trim()) {
        setError('Vui lòng nhập tên bạn muốn mọi người gọi mình!');
        return;
      }
      await saveProfileData(false);
      setStep(2);
    } else if (step === 2) {
      await saveProfileData(false);
      setStep(3);
    } else if (step === 3) {
      await saveProfileData(true);
    }
  };

  const completionPercentage = calculateCompletion();
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A14', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Đang tải thiết lập hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-wizard-container" style={{ minHeight: '100vh', background: '#0A0A14', color: '#fff', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Top Header */}
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, background: 'linear-gradient(135deg, #FF6B8A, #FF2D55)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LoveYou
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout} style={{ fontSize: '0.85rem' }}>
          Đăng xuất
        </button>
      </div>

      {/* Single Card Container */}
      <div style={{
        width: '100%', maxWidth: '640px',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '2.2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 45, 85, 0.15)',
      }}>
        
        {/* REAL-TIME COMPLETION PROGRESS BAR (0% TO 100%) */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mức độ hoàn thành • Bước {step} / 3
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FF2D55' }}>
              {completionPercentage}%
            </span>
          </div>

          {/* Animated Glow Bar */}
          <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #FF2D55, #FF6B8A, #34D399)',
              borderRadius: '10px',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 12px rgba(255, 45, 85, 0.5)',
            }} />
          </div>

          {/* Clean Segment Indicators */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '0.8rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: '4px', borderRadius: '2px',
                background: step >= i ? '#FF2D55' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s ease'
              }} />
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}><span>⚠</span> {error}</div>}

        <form onSubmit={handleNextStep}>

          {/* ── STEP 1: THÔNG TIN CƠ BẢN ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                Bạn muốn mọi người gọi mình là gì?
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.6rem' }}>
                Cho chúng mình biết một chút thông tin cơ bản về bạn nhé.
              </p>

              <Field
                label="Tên hiển thị của bạn"
                id="wiz-fullname"
                type="text"
                placeholder="VD: Alex Nguyễn, Minh Anh..."
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field">
                  <label htmlFor="wiz-gender">Giới tính</label>
                  <div className="input-wrap">
                    <select
                      id="wiz-gender"
                      className="input"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                <Field
                  label="Ngày sinh"
                  id="wiz-dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>

              <Field
                label="Nơi ở / Thành phố"
                id="wiz-location"
                type="text"
                placeholder="VD: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng..."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.8rem 2.2rem', fontSize: '0.95rem' }}>
                  {saving ? <span className="spinner" /> : 'Tiếp tục →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: SỞ THÍCH & TIỂU SỬ ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                Sở thích cá nhân
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.6rem' }}>
                Chọn các thẻ sở thích để thuật toán AI ghép đôi bạn với người hợp cạ hơn.
              </p>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.6rem' }}>
                  Chọn các thẻ sở thích (Khuyên chọn từ 3 thẻ):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {PRESET_INTERESTS.map((tag, idx) => {
                    const isSelected = form.interests.includes(tag);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        style={{
                          background: isSelected ? '#FF2D55' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                          border: isSelected ? '1px solid #FF2D55' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '20px',
                          padding: '0.4rem 0.85rem',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <label htmlFor="wiz-bio">Bài giới thiệu bản thân (About Me)</label>
                <div className="input-wrap">
                  <textarea
                    id="wiz-bio"
                    className="input"
                    rows="3"
                    placeholder="Chia sẻ về thói quen, công việc hay mẫu người bạn tìm kiếm..."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
              </div>

              <Field
                label="Chiều cao (cm)"
                id="wiz-height"
                type="number"
                placeholder="VD: 175"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                  ← Quay lại
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.8rem 2.2rem', fontSize: '0.95rem' }}>
                  {saving ? <span className="spinner" /> : 'Tiếp tục →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: BỘ SƯU TẬP ẢNH ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                Bộ sưu tập Ảnh cá nhân
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.6rem' }}>
                Thêm đường dẫn hình ảnh để hồ sơ của bạn thêm cuốn hút đối phương.
              </p>

              {/* Photo Preview Strip */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {form.photos.map((url, idx) => (
                  <div key={idx} style={{
                    flex: 1, height: '70px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)',
                    border: url ? '2px solid #FF2D55' : '1px dashed rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {url ? (
                      <img src={url} alt={`Preview ${idx + 1}`} onError={(e) => { e.target.src = defaultAvatar; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>#{idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>

              {form.photos.map((url, idx) => (
                <Field
                  key={idx}
                  label={idx === 0 ? 'Ảnh đại diện chính' : `Ảnh phụ #${idx + 1}`}
                  id={`wiz-photo-${idx}`}
                  type="text"
                  placeholder={`Dán đường dẫn URL ảnh #${idx + 1}`}
                  value={url}
                  onChange={(e) => handlePhotoChange(idx, e.target.value)}
                />
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                  ← Quay lại
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.8rem 2.2rem', background: 'linear-gradient(135deg, #FF2D55, #FF6B8A)', fontWeight: 800 }}>
                  {saving ? <span className="spinner" /> : 'Hoàn tất & Bắt đầu Hẹn hò 💖'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
