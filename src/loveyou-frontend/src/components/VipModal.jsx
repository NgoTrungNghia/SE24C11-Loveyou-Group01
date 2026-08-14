import { useState } from 'react';
import { paymentApi } from '../utils/api';

export default function VipModal({ isVip, onClose, onVipSuccess, setToast }) {
  const [loading, setLoading] = useState(false);
  const [embeddedUrl, setEmbeddedUrl] = useState(null);

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancel`;
      const res = await paymentApi.createPaymentLink(returnUrl, cancelUrl);
      const checkoutUrl = res.data?.data?.checkoutUrl;

      if (checkoutUrl) {
        setEmbeddedUrl(checkoutUrl);
      } else {
        throw new Error('Không nhận được liên kết thanh toán');
      }
    } catch (err) {
      if (setToast) setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể tạo liên kết thanh toán PayOS' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalBody} onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        {embeddedUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <button
                onClick={() => setEmbeddedUrl(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  borderRadius: '12px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                }}
              >
                ◀ Quay lại
              </button>
              <div style={{ color: '#FFD700', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💳 Thanh Toán VietQR</span>
              </div>
              <div style={{ width: '60px' }} />
            </div>

            <div style={{ position: 'relative', width: '100%', height: '520px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,215,0,0.3)', background: '#fff' }}>
              <iframe
                src={embeddedUrl}
                title="PayOS Checkout"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            <div style={{ marginTop: '0.4rem', textAlign: 'center', fontSize: '0.8rem', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#34D399' }} />
              <span>Hệ thống tự động nhận tiền & kích hoạt VIP ngay khi bạn quét QR...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Header */}
            <div style={styles.heroHeader}>
              <div style={styles.crownIcon}>👑</div>
              <h2 style={styles.title}>Nâng Cấp Tài Khoản VIP</h2>
              <p style={styles.subtitle}>Mở khóa các đặc quyền lung linh và tính năng độc quyền trên LoveYou</p>
            </div>

            {/* Current VIP status tag */}
            {isVip && (
              <div style={styles.vipActiveBadge}>
                ✨ Bạn hiện đang sở hữu Tài Khoản VIP Account ✨
              </div>
            )}

            {/* Feature List */}
            <div style={styles.featuresList}>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>✨</div>
                <div>
                  <div style={styles.featureTitle}>Khung Profile Lung Linh Chuẩn VIP</div>
                  <div style={styles.featureDesc}>Viền RGB Glowing lung linh xung quanh Avatar của bạn ở tất cả giao diện (Swipe Card, Header, Matches & Chat tin nhắn).</div>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>👁️</div>
                <div>
                  <div style={styles.featureTitle}>Thông Báo "Ai Đã Tim Mình" & "Mình Đã Tim Ai"</div>
                  <div style={styles.featureDesc}>Xem ngay danh sách đầy đủ những ai đã thích bạn, tương tác lại để Match ngay không cần chờ đợi.</div>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>🚀</div>
                <div>
                  <div style={styles.featureTitle}>Ưu Tiên Đề Xuất Hàng Đầu</div>
                  <div style={styles.featureDesc}>Tăng tần suất hiển thị hồ sơ của bạn cho các đối tượng phù hợp nhất xung quanh.</div>
                </div>
              </div>
            </div>

            {/* Pricing Banner */}
            <div style={styles.priceContainer}>
              <div style={styles.priceTag}>
                <span style={{ fontSize: '0.9rem', opacity: 0.85, textDecoration: 'line-through', marginRight: '8px' }}>99.000đ</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFD700' }}>3.000 VNĐ</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '6px' }}>/ VIP Account</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                Thanh toán qua quét mã QR / Momo / VNPay tự động
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.actions}>
              {!isVip ? (
                <button
                  onClick={handleCreatePayment}
                  disabled={loading}
                  style={styles.payBtn}
                >
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spinner" /> Đang tạo mã VietQR...
                    </span>
                  ) : (
                    '💳 Thanh Toán Qua VietQR (3.000đ)'
                  )}
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#34D399', fontWeight: 700, fontSize: '0.9rem', padding: '0.5rem' }}>
                  ✓ Bạn đang kích hoạt đặc quyền Tài Khoản VIP
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    animation: 'fadeIn 0.3s ease',
  },
  modalBody: {
    width: '100%',
    maxWidth: '520px',
    background: 'linear-gradient(145deg, #181124, #0d0a15)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '24px',
    padding: '2.2rem 1.8rem',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(255, 0, 128, 0.25)',
    animation: 'slideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeader: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  crownIcon: {
    fontSize: '3rem',
    marginBottom: '0.4rem',
    filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))',
    animation: 'typingBounce 2s infinite ease-in-out',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #FFD700, #FF6B8A, #34D399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.4rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: '400px',
    margin: '0 auto',
  },
  vipActiveBadge: {
    background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,0,128,0.2))',
    border: '1px solid rgba(255, 215, 0, 0.5)',
    color: '#FFD700',
    textAlign: 'center',
    padding: '8px 14px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.85rem',
    marginBottom: '1.2rem',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  featureItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '0.9rem 1rem',
  },
  featureIcon: {
    fontSize: '1.4rem',
    background: 'rgba(255, 215, 0, 0.12)',
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '2px',
  },
  featureDesc: {
    fontSize: '0.78rem',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 1.4,
  },
  priceContainer: {
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.15), rgba(255, 215, 0, 0.15))',
    border: '1px dashed rgba(255, 215, 0, 0.4)',
    borderRadius: '18px',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  priceTag: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  payBtn: {
    width: '100%',
    padding: '0.9rem',
    borderRadius: '16px',
    border: 'none',
    background: 'linear-gradient(135deg, #FF007F, #FF8C00, #FFD700)',
    color: '#000',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(255, 0, 128, 0.4)',
    transition: 'all 0.2s ease',
  },
  demoBtn: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    background: 'rgba(255, 215, 0, 0.1)',
    color: '#FFD700',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  cancelVipBtn: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '16px',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
};
