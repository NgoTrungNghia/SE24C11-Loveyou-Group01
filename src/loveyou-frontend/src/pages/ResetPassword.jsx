import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout, Brand, Field } from '../components/shared';
import { authApi } from '../utils/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = location.state?.resetToken || '';

  const [form, setForm] = useState({
    newPassword: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!resetToken) {
      setApiError('Mã ủy quyền đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.');
    }
  }, [resetToken]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!resetToken) e.token = 'Yêu cầu mã ủy quyền đặt lại mật khẩu';
    if (form.newPassword.length < 6) e.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    if (form.newPassword !== form.confirm) e.confirm = 'Mật khẩu xác nhận không khớp';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, form.newPassword);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setApiError(
        err.response?.data?.error?.message || 'Đặt lại mật khẩu thất bại. Mã ủy quyền có thể đã hết hạn.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">Tạo mật khẩu mới</h2>
      <p className="card-subtitle">Nhập mật khẩu mới an toàn cho tài khoản của bạn</p>

      {done ? (
        <div className="form">
          <div className="alert alert-success" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <strong>✓ Đã cập nhật mật khẩu mới thành công!</strong>
            <span style={{ fontSize: '0.82rem' }}>Đang tự động chuyển đến trang đăng nhập sau 3 giây…</span>
          </div>
          <Link to="/login">
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Đến trang đăng nhập ngay →
            </button>
          </Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {apiError && (
            <div className="alert alert-error">
              <span>⚠</span> {apiError}
            </div>
          )}
          {errors.token && (
            <div className="alert alert-error">
              <span>⚠</span> {errors.token}
            </div>
          )}

          <Field
            label="Mật khẩu mới"
            id="new-password"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={set('newPassword')}
            error={errors.newPassword}
          />

          <Field
            label="Xác nhận mật khẩu mới"
            id="confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
          />

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !resetToken}
            id="reset-btn"
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
          </button>

          <div className="divider">hoặc</div>
          <Link to="/forgot-password">
            <button type="button" className="btn btn-ghost">
              Yêu cầu gửi mã mới
            </button>
          </Link>
        </form>
      )}

      <p className="form-footer">
        <Link to="/login">← Quay lại đăng nhập</Link>
      </p>
    </AuthLayout>
  );
}
