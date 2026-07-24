import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout, Brand, Field } from '../components/shared';
import { authApi } from '../utils/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    token:       location.state?.token || '',
    newPassword: '',
    confirm:     '',
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [done, setDone]       = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.token.trim())       e.token       = 'Reset token is required';
    if (form.newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
    if (form.newPassword !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(form.token.trim(), form.newPassword);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setApiError(err.response?.data?.error?.message || 'Reset failed. Token may be expired or invalid.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">New password</h2>
      <p className="card-subtitle">Enter your reset token and choose a new password 🔐</p>

      {done ? (
        <div className="form">
          <div className="alert alert-success" style={{ flexDirection:'column', gap:'0.5rem' }}>
            <strong>✓ Password updated successfully!</strong>
            <span style={{ fontSize:'0.82rem' }}>Redirecting to sign in in 3 seconds…</span>
          </div>
          <Link to="/login">
            <button className="btn btn-primary" style={{ width:'100%' }}>Go to sign in →</button>
          </Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {apiError && <div className="alert alert-error"><span>⚠</span> {apiError}</div>}

          <Field
            label="Reset token"
            id="reset-token"
            type="text"
            placeholder="Paste your reset token here"
            value={form.token}
            onChange={set('token')}
            error={errors.token}
            icon="🔑"
          />

          <Field
            label="New password"
            id="new-password"
            type="password"
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={set('newPassword')}
            error={errors.newPassword}
            icon="🔒"
          />

          <Field
            label="Confirm new password"
            id="confirm-password"
            type="password"
            placeholder="Repeat your new password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            icon="✅"
          />

          <button className="btn btn-primary" type="submit" disabled={loading} id="reset-btn">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Updating…' : 'Update password'}
          </button>

          <div className="divider">or</div>
          <Link to="/forgot-password">
            <button type="button" className="btn btn-ghost">Get a new token</button>
          </Link>
        </form>
      )}

      <p className="form-footer">
        <Link to="/login">← Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
