import { useState, useEffect, useRef } from 'react';
import { paymentApi } from '../utils/api';

export default function VipModal({ isVip, onClose, onVipSuccess, setToast }) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null); // { checkoutUrl, orderCode }
  const [polling, setPolling] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const pollTimerRef = useRef(null);

  // Poll for payment status when paymentData is active
  useEffect(() => {
    if (!paymentData?.orderCode || paidSuccess) return;

    setPolling(true);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await paymentApi.getStatus(paymentData.orderCode);
        const status = res.data?.data?.status;
        if (status === 'PAID' || status === 'SUCCESS') {
          clearInterval(pollTimerRef.current);
          setPaidSuccess(true);
          if (onVipSuccess) onVipSuccess(true);
          if (setToast) setToast({ type: 'success', message: '🎉 Chúc mừng bạn đã nâng cấp Tài Khoản VIP thành công!' });
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } catch {
        /* ignore polling errors */
      }
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [paymentData, paidSuccess]);

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancel`;
      const res = await paymentApi.createPaymentLink(returnUrl, cancelUrl);
      const { checkoutUrl, orderCode } = res.data?.data || {};

      if (checkoutUrl) {
        setPaymentData({ checkoutUrl, orderCode });
        // Open checkout in new tab so parent app stays clean and active
        const newWin = window.open(checkoutUrl, '_blank');
        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
          // Popup blocked - inform user to click direct button
          if (setToast) setToast({ type: 'info', message: 'Vui lòng nhấn nút bên dưới để mở trang thanh toán PayOS' });
        }
      } else {
        throw new Error('Không nhận được liên kết thanh toán');
      }
    } catch (err) {
      if (setToast) setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể tạo liên kết thanh toán PayOS' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!paymentData?.orderCode) return;
    try {
      const res = await paymentApi.getStatus(paymentData.orderCode);
      const status = res.data?.data?.status;
      if (status === 'PAID' || status === 'SUCCESS') {
        setPaidSuccess(true);
        if (onVipSuccess) onVipSuccess(true);
        if (setToast) setToast({ type: 'success', message: '🎉 Kích hoạt VIP thành công!' });
        setTimeout(() => onClose(), 2000);
      } else {
        if (setToast) setToast({ type: 'info', message: 'Hệ thống chưa ghi nhận thanh toán. Vui lòng hoàn tất quét mã QR.' });
      }
    } catch (err) {
      if (setToast) setToast({ type: 'error', message: err.response?.data?.error?.message || 'Kiểm tra trạng thái thất bại' });
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalBody} onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        {paidSuccess ? (
          /* SUCCESS CELEBRATION SCREEN */
          <div style={{ textAlign: 'center', padding: '2rem 1rem', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '0.8rem', filter: 'drop-shadow(0 0 25px rgba(255,215,0,0.8))' }}>
              👑✨
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFD700', marginBottom: '0.6rem' }}>
              KÍCH HOẠT VIP THÀNH CÔNG!
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 1.8rem auto' }}>
              Chúc mừng bạn đã sở hữu <b>Tài Khoản VIP</b>! Toàn bộ đặc quyền lung linh và tính năng độc quyền đã sẵn sàng.
            </p>
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FF8C00, #FF007F)',
                color: '#000', border: 'none', borderRadius: '16px',
                padding: '0.85rem 2rem', fontWeight: 800, fontSize: '1rem',
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,215,0,0.5)',
              }}
            >
              Bắt Đầu Trải Nghiệm Ngay 💖
            </button>
          </div>
        ) : paymentData ? (
          /* ACTIVE PAYMENT GATEWAY CARD (NO BROKEN IFRAME) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setPaymentData(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  borderRadius: '12px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                }}
              >
                ◀ Quay lại
              </button>
              <div style={{ color: '#FFD700', fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💳 Cổng Thanh Toán PayOS VietQR</span>
              </div>
              <div style={{ width: '50px' }} />
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              borderRadius: '20px',
              padding: '1.8rem 1.4rem',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '0.6rem' }}>📱⚡</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
                Đang chờ thanh toán VietQR (3.000đ)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: '1.4rem' }}>
                Trang thanh toán PayOS đã được mở trong cửa sổ mới. Vui lòng quét mã VietQR bằng app ngân hàng / MoMo / VNPay để hoàn tất.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <a
                  href={paymentData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    background: 'linear-gradient(135deg, #FF007F, #FF8C00, #FFD700)',
                    color: '#000', textDecoration: 'none', borderRadius: '14px',
                    padding: '0.85rem 1.2rem', fontWeight: 800, fontSize: '0.95rem',
                    boxShadow: '0 6px 20px rgba(255,0,128,0.4)',
                  }}
                >
                  🚀 Mở Lại Trang Thanh Toán PayOS ➔
                </a>

                <button
                  type="button"
                  onClick={handleManualCheck}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px',
                    padding: '0.75rem 1.2rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  🔄 Tôi Đã Thanh Toán (Kiểm tra ngay)
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#34D399' }} />
              <span>Hệ thống tự động kích hoạt VIP ngay khi ngân hàng báo nhận tiền...</span>
            </div>
          </div>
        ) : (
          /* STANDARD VIP OVERVIEW SCREEN */
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
                  <div style={styles.featureDesc}>Viền RGB Glowing lung linh xung quanh Avatar & Modal Hồ sơ ở tất cả giao diện (Swipe Card, Header, Matches & Chat tin nhắn).</div>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>👁️</div>
                <div>
                  <div style={styles.featureTitle}>Xem Ai Đã Thả Tim Cho Mình</div>
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
};
