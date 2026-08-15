import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, Brand, Field } from '../components/shared';
import { authApi } from '../utils/api';

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError]   = useState('');
  const [loading, setLoading]     = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Vui lòng nhập tên người dùng (username)';
    if (!form.email.trim())    e.email    = 'Vui lòng nhập địa chỉ email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Địa chỉ email không đúng định dạng';
    if (form.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authApi.signup({
        username: form.username.trim(),
        email:    form.email.trim(),
        password: form.password,
        phone:    form.phone.trim() || undefined,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const errData = err.response?.data?.error;
      const msg     = errData?.message || 'Đăng ký thất bại, vui lòng thử lại';
      const field   = errData?.field   || null;

      // Handle field-level issues array
      if (errData?.issues?.length) {
        const fe = {};
        errData.issues.forEach(i => { if (i.field) fe[i.field] = i.message; });
        setErrors(fe);
      } else if (field) {
        setErrors((er) => ({ ...er, [field]: msg }));
      } else {
        setApiError(msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">Tạo tài khoản mới</h2>
      <p className="card-subtitle">Bắt đầu câu chuyện tình yêu của bạn ngay hôm nay 💕</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div className="alert alert-error"><span>⚠</span> {apiError}</div>
        )}

        <Field
          label="Tên đăng nhập (Username)"
          id="username"
          type="text"
          placeholder="ví dụ: huong_lan2025"
          autoComplete="username"
          value={form.username}
          onChange={set('username')}
          error={errors.username}
        />

        <Field
          label="Địa chỉ Email"
          id="email"
          type="email"
          placeholder="nhap_email@gmail.com"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />

        <Field
          label="Mật khẩu"
          id="password"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />

        <Field
          label="Số điện thoại (tùy chọn)"
          id="phone"
          type="tel"
          placeholder="+84 900 000 000"
          autoComplete="tel"
          value={form.phone}
          onChange={set('phone')}
        />

        <button className="btn btn-primary" type="submit" disabled={loading} id="signup-btn">
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Đang tạo tài khoản…' : 'Đăng ký tài khoản'}
        </button>
      </form>

      <p className="form-footer">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthLayout>
  );
}
