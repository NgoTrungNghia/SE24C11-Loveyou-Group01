import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, Brand, Field } from '../components/shared';
import { authApi } from '../utils/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'new_password' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // 1. Request OTP
  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setInfo(`Mã xác thực đặt lại mật khẩu đã được gửi đến email ${email.trim()}.`);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Yêu cầu thất bại, vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Vui lòng nhập đủ 6 chữ số mã xác thực từ email.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email.trim(), otp.trim());
      const token = res.data.data.resetToken;
      setResetToken(token);
      setInfo('');
      setStep('new_password');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const fe = {};
    if (newPassword.length < 6) {
      fe.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    if (newPassword !== confirmPassword) {
      fe.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setStep('done');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Đặt lại mật khẩu thất bại. Mã ủy quyền có thể đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">
        {step === 'new_password' ? 'Tạo mật khẩu mới' : 'Đặt lại mật khẩu'}
      </h2>
      <p className="card-subtitle">
        {step === 'email' && 'Nhập email để nhận mã xác thực đặt lại mật khẩu'}
        {step === 'otp' && 'Nhập mã 6 chữ số đã được gửi đến email của bạn'}
        {step === 'new_password' && 'Nhập mật khẩu mới an toàn cho tài khoản của bạn'}
        {step === 'done' && 'Hoàn tất cập nhật mật khẩu ✨'}
      </p>

      {/* STEP 1: EMAIL */}
      {step === 'email' && (
        <form className="form" onSubmit={handleRequest} noValidate>
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <Field
            label="Địa chỉ Email"
            id="fp-email"
            type="email"
            placeholder="nhap_email@gmail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="btn btn-primary" type="submit" disabled={loading} id="forgot-btn">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Đang gửi mã…' : 'Gửi mã xác thực'}
          </button>

          <div className="divider">hoặc</div>
          <Link to="/login">
            <button type="button" className="btn btn-ghost" style={{ width: '100%' }}>
              Quay lại đăng nhập
            </button>
          </Link>
        </form>
      )}

      {/* STEP 2: OTP */}
      {step === 'otp' && (
        <form className="form" onSubmit={handleVerify} noValidate>
          {info && <div className="alert alert-success">✓ {info}</div>}
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <Field
            label="Mã xác thực (OTP)"
            id="fp-otp"
            type="text"
            inputMode="numeric"
            placeholder="Mã gồm 6 chữ số"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />

          <button className="btn btn-primary" type="submit" disabled={loading} id="verify-otp-btn">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Đang xác thực…' : 'Xác thực mã & Tiếp tục'}
          </button>

          <div className="divider">hoặc</div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => {
              setStep('email');
              setOtp('');
              setError('');
              setInfo('');
            }}
          >
            Sử dụng email khác
          </button>
        </form>
      )}

      {/* STEP 3: NEW PASSWORD */}
      {step === 'new_password' && (
        <form className="form" onSubmit={handleResetPassword} noValidate>
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <Field
            label="Mật khẩu mới"
            id="new-password"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFieldErrors((fe) => ({ ...fe, newPassword: '' }));
            }}
            error={fieldErrors.newPassword}
          />

          <Field
            label="Xác nhận mật khẩu mới"
            id="confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((fe) => ({ ...fe, confirmPassword: '' }));
            }}
            error={fieldErrors.confirmPassword}
          />

          <button className="btn btn-primary" type="submit" disabled={loading} id="save-new-pwd-btn">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu mới'}
          </button>

          <div className="divider">hoặc</div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => {
              setStep('email');
              setOtp('');
              setNewPassword('');
              setConfirmPassword('');
              setError('');
            }}
          >
            Bắt đầu lại
          </button>
        </form>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 'done' && (
        <div className="form">
          <div className="alert alert-success" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <strong>✓ Đã cập nhật mật khẩu mới thành công!</strong>
            <span style={{ fontSize: '0.85rem' }}>Đang tự động chuyển hướng đến trang đăng nhập sau 2 giây…</span>
          </div>
          <Link to="/login">
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Đăng nhập ngay →
            </button>
          </Link>
        </div>
      )}

      <p className="form-footer">
        Đã nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthLayout>
  );
}
