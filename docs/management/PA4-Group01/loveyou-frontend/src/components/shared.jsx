import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Floating hearts background decoration
export function Hearts() {
  const hearts = ['❤️','🩷','💖','💗','💝'];
  return (
    <div className="hearts" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="heart" style={{
          left: `${Math.random() * 100}%`,
          fontSize: `${0.7 + Math.random() * 0.8}rem`,
          animationDuration: `${8 + Math.random() * 10}s`,
          animationDelay: `${Math.random() * 8}s`,
        }}>
          {hearts[i % hearts.length]}
        </span>
      ))}
    </div>
  );
}

// Brand logo block
export function Brand() {
  return (
    <div className="brand">
      <div className="brand-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <div className="brand-name">LoveYou</div>
      <div className="brand-tagline">Find your perfect match</div>
    </div>
  );
}

// Wraps auth pages
export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <Hearts />
      <div className="auth-card">
        {children}
      </div>
    </div>
  );
}

// Route guard — redirect to /login if not authenticated
export function ProtectedRoute({ children }) {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

// Route guard — redirect to /dashboard if already logged in
export function GuestRoute({ children }) {
  const { token, user } = useAuth();
  if (token && user) return <Navigate to="/dashboard" replace />;
  return children;
}

// Reusable input field with icon
export function Field({ label, id, icon, error, ...inputProps }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-wrap">
        <input id={id} className={error ? 'error' : ''} {...inputProps} />
        {icon && <span className="input-icon">{icon}</span>}
      </div>
      {error && <span className="field-error">⚠ {error}</span>}
    </div>
  );
}
