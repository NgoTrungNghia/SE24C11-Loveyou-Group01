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
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.email.trim())    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
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
      const msg     = errData?.message || 'Sign up failed';
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

      <h2 className="card-title">Create account</h2>
      <p className="card-subtitle">Start your love story today 💕</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div className="alert alert-error"><span>⚠</span> {apiError}</div>
        )}

        <Field
          label="Username"
          id="username"
          type="text"
          placeholder="e.g. rose_2025"
          autoComplete="username"
          value={form.username}
          onChange={set('username')}
          error={errors.username}
          icon="👤"
        />

        <Field
          label="Email address"
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          icon="✉"
        />

        <Field
          label="Password"
          id="password"
          type="password"
          placeholder="Min. 6 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          icon="🔒"
        />

        <Field
          label="Phone number (optional)"
          id="phone"
          type="tel"
          placeholder="+84 900 000 000"
          autoComplete="tel"
          value={form.phone}
          onChange={set('phone')}
          icon="📱"
        />

        <button className="btn btn-primary" type="submit" disabled={loading} id="signup-btn">
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="form-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
