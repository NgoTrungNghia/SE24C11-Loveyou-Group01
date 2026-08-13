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
    if (!form.email)    { setFieldErrors({ email: 'Email is required' }); return; }
    if (!form.password) { setFieldErrors({ password: 'Password is required' }); return; }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) { setFieldErrors({ email: 'Enter a valid email address' }); return; }

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
        setError(result.message);
      }
    }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">Welcome back</h2>
      <p className="card-subtitle">Sign in to continue your journey ✨</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <Field
          label="Email address"
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
        />

        <Field
          label="Password"
          id="password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
        />

        <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.82rem' }}>Forgot password?</Link>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} id="login-btn">
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="form-footer">
        Don't have an account? <Link to="/signup">Create one</Link>
      </p>
    </AuthLayout>
  );
}
