import { useState, useEffect, useRef } from 'react';
import { paymentApi } from '../utils/api';
import { getSocket } from '../utils/socket';

export default function VipModal({ isVip, onClose, onVipSuccess, setToast }) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null); // { checkoutUrl, orderCode, qrCode, accountNumber, accountName, bin, description, amount }
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const pollTimerRef = useRef(null);

  // Auto-listen to Socket.io for instant VIP activation
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleVipUpgraded = ({ isVip: upgradedVip }) => {
      if (upgradedVip) {
        handleSuccessActivation();
      }
    };

    socket.on('vip_upgraded', handleVipUpgraded);
    return () => socket.off('vip_upgraded', handleVipUpgraded);
  }, []);

  // Poll for payment status when paymentData is active
  useEffect(() => {
    if (!paymentData?.orderCode || paidSuccess) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await paymentApi.getStatus(paymentData.orderCode);
        const status = res.data?.data?.payment?.status || res.data?.data?.status;
        if (status === 'PAID' || status === 'SUCCESS') {
          handleSuccessActivation();
        }
      } catch {
        /* ignore polling errors */
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [paymentData, paidSuccess]);

  const handleSuccessActivation = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setPaidSuccess(true);
    if (onVipSuccess) onVipSuccess(true);
    if (setToast) setToast({ type: 'success', message: '🎉 Chúc mừng bạn đã nâng cấp Tài Khoản VIP thành công!' });
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancel`;
      const res = await paymentApi.createPaymentLink(returnUrl, cancelUrl);
      const data = res.data?.data || {};

      if (data.checkoutUrl || data.orderCode) {
        setPaymentData(data);
      } else {
        throw new Error('Không nhận được thông tin thanh toán');
      }
    } catch (err) {
      if (setToast) setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể khởi tạo mã VietQR thanh toán' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!paymentData?.orderCode) return;
    try {
      const res = await paymentApi.getStatus(paymentData.orderCode);
      const status = res.data?.data?.payment?.status || res.data?.data?.status;
      if (status === 'PAID' || status === 'SUCCESS') {
        handleSuccessActivation();
      } else {
        if (setToast) setToast({ type: 'info', message: 'Hệ thống chưa ghi nhận thanh toán. Vui lòng hoàn tất quét mã QR.' });
      }
    } catch (err) {
      if (setToast) setToast({ type: 'error', message: err.response?.data?.error?.message || 'Kiểm tra trạng thái thất bại' });
    }
  };


  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Construct VietQR Image
  const getQrImageUrl = () => {
    if (!paymentData) return '';
    const { bin, accountNumber, amount, description, accountName, qrCode, checkoutUrl } = paymentData;
    if (bin && accountNumber) {
      return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png?amount=${amount || 3000}&addInfo=${encodeURIComponent(description || '')}&accountName=${encodeURIComponent(accountName || '')}`;
    }
    if (qrCode) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkoutUrl || '')}`;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="vip-modal-body custom-scrollbar" style={styles.modalBody} onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={onClose} title="Đóng">✕</button>

        {paidSuccess ? (
          /* SUCCESS CELEBRATION SCREEN */
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: '4.8rem', marginBottom: '0.8rem', filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.9))', animation: 'bounce 1s infinite' }}>
              👑✨
            </div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFD700', marginBottom: '0.6rem', letterSpacing: '0.5px' }}>
              KÍCH HOẠT VIP THÀNH CÔNG!
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Chào mừng bạn đến với hội viên <b>Tài Khoản VIP</b>! Toàn bộ tính năng độc quyền và khung viền lung linh đã được kích hoạt.
            </p>
            <div style={{ color: '#34D399', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#34D399' }} />
              <span>Đang chuyển về trang chủ VIP...</span>
            </div>
          </div>
        ) : paymentData ? (
          /* IN-APP EMBEDDED VIETQR POPUP */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
              <button
                onClick={() => setPaymentData(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.8)',
                  borderRadius: '10px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                }}
              >
                ← Quay lại
              </button>
              <div style={{ color: '#FFD700', fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚡ Quét Mã VietQR Thanh Toán</span>
              </div>
              <div style={{ width: '60px' }} />
            </div>

            {/* QR Card & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {/* QR Image Frame */}
              <div style={{
                background: '#fff',
                padding: '16px',
                borderRadius: '22px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.7), 0 0 30px rgba(255,215,0,0.45)',
                border: '3px solid #FFD700',
                display: 'inline-block',
                position: 'relative',
              }}>
                <img
                  src={getQrImageUrl()}
                  alt="Mã QR Thanh Toán PayOS"
                  style={{
                    width: '260px',
                    height: '260px',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '10px',
                  }}
                  onError={(e) => {
                    // Fallback to QR Server
                    if (paymentData.checkoutUrl) {
                      e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentData.checkoutUrl)}`;
                    }
                  }}
                />
                <div style={{
                  textAlign: 'center', marginTop: '8px', fontSize: '12px', fontWeight: 800, color: '#000',
                  letterSpacing: '0.6px', textTransform: 'uppercase'
                }}>
                  VietQR • PayOS
                </div>
              </div>

              {/* Status Pulse */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '6px 14px', borderRadius: '20px', color: '#34D399', fontSize: '0.82rem', fontWeight: 700,
              }}>
                <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#34D399' }} />
                <span>Đang chờ bạn quét mã thanh toán...</span>
              </div>

              {/* Bank Transfer Details Table */}
              <div style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: '16px',
                padding: '0.9rem 1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.84rem',
              }}>
                {/* Account Number */}
                {paymentData.accountNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Số tài khoản:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#FFD700', fontSize: '0.95rem' }}>{paymentData.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentData.accountNumber, 'acc')}
                        style={styles.copyBtn}
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === 'acc' ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Name */}
                {paymentData.accountName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Chủ tài khoản:</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{paymentData.accountName}</span>
                  </div>
                )}

                {/* Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Số tiền:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#34D399', fontSize: '1rem' }}>
                      {Number(paymentData.amount || 3000).toLocaleString('vi-VN')} VNĐ
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData.amount || 3000, 'amount')}
                      style={styles.copyBtn}
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                {/* Transfer Content */}
                {paymentData.description && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Nội dung CK:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#FF6B8A', fontSize: '0.9rem' }}>{paymentData.description}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentData.description, 'desc')}
                        style={styles.copyBtn}
                        title="Sao chép nội dung chuyển khoản"
                      >
                        {copiedField === 'desc' ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem' }}>
              <button
                type="button"
                onClick={handleManualCheck}
                style={{
                  width: '100%', padding: '0.85rem', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,0,128,0.15))',
                  border: '1px solid rgba(255,215,0,0.4)',
                  color: '#FFD700', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 15px rgba(255,215,0,0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>🔄 Tôi Đã Chuyển Khoản (Kiểm Tra Trạng Thái)</span>
              </button>
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
    maxWidth: '500px',
    maxHeight: '92vh',
    overflowY: 'auto',
    background: 'linear-gradient(145deg, #181124, #0d0a15)',
    border: '1px solid rgba(255, 215, 0, 0.35)',
    borderRadius: '24px',
    padding: '2rem 1.6rem',
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
    zIndex: 10,
  },
  copyBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
    gap: '0.9rem',
    marginBottom: '1.4rem',
  },
  featureItem: {
    display: 'flex',
    gap: '0.9rem',
    alignItems: 'flex-start',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '0.85rem 0.95rem',
  },
  featureIcon: {
    fontSize: '1.3rem',
    background: 'rgba(255, 215, 0, 0.12)',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '0.9rem',
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
    padding: '0.9rem',
    marginBottom: '1.4rem',
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
