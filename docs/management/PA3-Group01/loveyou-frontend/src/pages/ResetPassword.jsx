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
      setApiError('Reset authorization is missing or expired. Request a new code.');
    }
  }, [resetToken]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!resetToken) e.token = 'Reset authorization is required';
    if (form.newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
    if (form.newPassword !== form.confirm) e.confirm = 'Passwords do not match';
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
        err.response?.data?.error?.message || 'Reset failed. Authorization may be expired or invalid.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">New password</h2>
      <p className="card-subtitle">Choose a new password for your account</p>

      {done ? (
        <div className="form">
          <div className="alert alert-success" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <strong>✓ Password updated successfully!</strong>
            <span style={{ fontSize: '0.82rem' }}>Redirecting to sign in in 3 seconds…</span>
          </div>
          <Link to="/login">
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Go to sign in →
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

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !resetToken}
            id="reset-btn"
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Updating…' : 'Update password'}
          </button>

          <div className="divider">or</div>
          <Link to="/forgot-password">
            <button type="button" className="btn btn-ghost">
              Request a new code
            </button>
          </Link>
        </form>
      )}

      <p className="form-footer">
        <Link to="/login">← Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
