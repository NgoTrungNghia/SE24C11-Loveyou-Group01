import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, Brand, Field } from '../components/shared';
import { authApi } from '../utils/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | otp
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setInfo('A reset code was sent to your email.');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the six-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email.trim(), otp.trim());
      const resetToken = res.data.data.resetToken;
      navigate('/reset-password', { state: { resetToken }, replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Brand />

      <h2 className="card-title">Reset password</h2>
      <p className="card-subtitle">
        {step === 'email'
          ? 'Enter your email to receive a one-time code'
          : 'Enter the six-digit code sent to your email'}
      </p>

      {step === 'email' ? (
        <form className="form" onSubmit={handleRequest} noValidate>
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

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
            {loading ? 'Sending…' : 'Send reset code'}
          </button>

          <div className="divider">or</div>
          <Link to="/login">
            <button type="button" className="btn btn-ghost">
              Back to sign in
            </button>
          </Link>
        </form>
      ) : (
        <form className="form" onSubmit={handleVerify} noValidate>
          {info && <div className="alert alert-success">✓ {info}</div>}
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <Field
            label="One-time code"
            id="fp-otp"
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            icon="🔑"
          />

          <button className="btn btn-primary" type="submit" disabled={loading} id="verify-otp-btn">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Verifying…' : 'Verify code'}
          </button>

          <div className="divider">or</div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setStep('email');
              setOtp('');
              setError('');
              setInfo('');
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="form-footer">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
