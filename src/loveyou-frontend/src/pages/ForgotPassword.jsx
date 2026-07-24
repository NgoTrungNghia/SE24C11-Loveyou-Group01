import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, Brand, Field } from '../components/shared';
import { authApi } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null); // { resetToken, expiresAt }
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Request failed');
    } finally { setLoading(false); }
  };

  const copyToken = () => {
    if (result?.resetToken) {
      navigator.clipboard.writeText(result.resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">Reset password</h2>
      <p className="card-subtitle">Enter your email to receive a reset token 🔑</p>

      {!result ? (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

          <Field
            label="Email address"
            id="fp-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="✉"
          />

          <button className="btn btn-primary" type="submit" disabled={loading} id="forgot-btn">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Sending…' : 'Send reset token'}
          </button>

          <div className="divider">or</div>
          <Link to="/login"><button type="button" className="btn btn-ghost">Back to sign in</button></Link>
        </form>
      ) : (
        <div className="form">
          <div className="alert alert-success">
            ✓ Reset token generated! Copy it below and use it on the reset page.
          </div>

          <div className="token-box">
            <div className="token-label">Your reset token (click to copy)</div>
            <div
              className="token-value"
              onClick={copyToken}
              title="Click to copy"
              id="reset-token-display"
            >
              {result.resetToken}
            </div>
            <div className="token-expiry">
              ⏱ Expires at: {new Date(result.expiresAt).toLocaleString()}
            </div>
          </div>

          {copied && (
            <div className="alert alert-info">✓ Token copied to clipboard!</div>
          )}

          <Link to="/reset-password" state={{ token: result.resetToken }}>
            <button className="btn btn-primary" style={{ width:'100%' }} id="go-reset-btn">
              Continue to reset password →
            </button>
          </Link>
        </div>
      )}

      {!result && (
        <p className="form-footer">
          Remembered it? <Link to="/login">Sign in</Link>
        </p>
      )}
    </AuthLayout>
  );
}
