import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, Brand, Field } from '../components/shared';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('banned') === 'true') {
      setError('Tài khoản của bạn đã bị khóa, vui lòng sử dụng tài khoản khác');
    }
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [k]: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    if (!form.email)    { setFieldErrors({ email: 'Vui lòng nhập địa chỉ email' }); return; }
    if (!form.password) { setFieldErrors({ password: 'Vui lòng nhập mật khẩu' }); return; }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) { setFieldErrors({ email: 'Địa chỉ email không đúng định dạng' }); return; }

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.ok) {
      if (result.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      // API may return field-level issues
      if (result.issues?.length) {
        const fe = {};
        result.issues.forEach(i => { if (i.field) fe[i.field] = i.message; });
        setFieldErrors(fe);
      } else {
        setError(result.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại');
      }
    }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">Chào mừng trở lại</h2>
      <p className="card-subtitle">Đăng nhập để tiếp tục hành trình kết nối ✨</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <Field
          label="Địa chỉ Email"
          id="email"
          type="email"
          placeholder="nhap_email@gmail.com"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
        />

        <Field
          label="Mật khẩu"
          id="password"
          type="password"
          placeholder="Nhập mật khẩu của bạn"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
        />

        <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.85rem' }}>Quên mật khẩu?</Link>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} id="login-btn">
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <p className="form-footer">
        Chưa có tài khoản? <Link to="/signup">Đăng ký ngay</Link>
      </p>
    </AuthLayout>
  );
}
