import { useEffect } from 'react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  const bgColor = isSuccess
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
    : isError
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))'
    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))';

  const borderColor = isSuccess
    ? 'rgba(52, 211, 153, 0.5)'
    : isError
    ? 'rgba(248, 113, 113, 0.5)'
    : 'rgba(251, 191, 36, 0.5)';

  const icon = isSuccess ? '✅' : isError ? '❌' : '⚠️';

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        padding: '0.9rem 1.4rem',
        borderRadius: '16px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        color: '#ffffff',
        fontSize: '0.9rem',
        fontWeight: 600,
        maxWidth: '380px',
        animation: 'slideInToast 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        lineHeight: 1.4,
      }}
    >
      <style>{`
        @keyframes slideInToast {
          from {
            transform: translateY(-20px) scale(0.92);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>{toast.message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: '#fff',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '0.4rem',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
