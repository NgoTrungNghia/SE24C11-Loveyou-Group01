import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../utils/api';
import { Hearts } from '../components/shared';

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const testAdminRoute = async () => {
    setAdminError('');
    setAdminData(null);
    setAdminLoading(true);
    try {
      const res = await adminApi.stats();
      setAdminData(res.data.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) setAdminError('403 Forbidden — USER role cannot access this admin route.');
      else if (status === 401) setAdminError('401 Unauthorized — token missing or invalid.');
      else setAdminError(err.response?.data?.error?.message || 'Request failed');
    } finally { setAdminLoading(false); }
  };

  const initials = user?.userId ? `U${user.userId}` : '?';

  return (
    <div className="dashboard-layout">
      <Hearts />

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">LoveYou ❤</div>
        <div className="navbar-actions">
          <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
            {user?.role && (
              <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
            )}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="logout-btn">
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="dashboard-content">

        {/* Welcome banner */}
        <div className="welcome-banner">
          <div className="welcome-avatar">💝</div>
          <div className="welcome-text">
            <h1>Welcome back!</h1>
            <p>You're now signed in to LoveYou. Your journey to finding the perfect match starts here.</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          {[
            { icon: '💌', value: '0',   label: 'Messages' },
            { icon: '👀', value: '0',   label: 'Profile Views' },
            { icon: '💑', value: '0',   label: 'Matches' },
            { icon: '⭐', value: 'New', label: 'Your Status' },
          ].map((s, i) => (
            <div className="stat-card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="user-info-card" style={{ marginBottom: '1.25rem' }}>
          <h2>Account Details</h2>
          <div className="info-row">
            <span className="info-key">User ID</span>
            <span className="info-value">#{user?.userId}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Role</span>
            <span className="info-value">
              <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
            </span>
          </div>
          <div className="info-row">
            <span className="info-key">Session</span>
            <span className="info-value"><span className="badge badge-active">Active</span></span>
          </div>
          <div className="info-row">
            <span className="info-key">Token expires</span>
            <span className="info-value" style={{ fontSize:'0.82rem' }}>
              {user?.exp ? new Date(user.exp * 1000).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>

        {/* RBAC test panel */}
        <div className="user-info-card">
          <h2>🛡 RBAC Demo — Admin Route Test</h2>
          <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'1rem', fontFamily:'Inter' }}>
            Test role-based access control by calling <code style={{ color:'var(--rose-light)', background:'rgba(255,45,85,0.1)', padding:'0.1rem 0.4rem', borderRadius:'4px' }}>GET /api/admin/stats</code>.
            {isAdmin ? ' You are ADMIN — this should succeed.' : ' You are USER — this should return 403 Forbidden.'}
          </p>

          <button
            className="btn btn-primary btn-sm"
            onClick={testAdminRoute}
            disabled={adminLoading}
            id="test-admin-btn"
            style={{ width: 'auto', marginBottom: adminData || adminError ? '0.75rem' : 0 }}
          >
            {adminLoading ? <span className="spinner" /> : '🔐'}
            {adminLoading ? ' Testing…' : ' Test admin route'}
          </button>

          {adminError && (
            <div className="alert alert-error"><span>✗</span> {adminError}</div>
          )}
          {adminData && (
            <div className="alert alert-success">
              <span>✓</span>
              <span>
                <strong>200 OK</strong> — Admin access granted!
                <br />
                <span style={{ fontSize:'0.8rem' }}>{JSON.stringify(adminData.stats)}</span>
              </span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
