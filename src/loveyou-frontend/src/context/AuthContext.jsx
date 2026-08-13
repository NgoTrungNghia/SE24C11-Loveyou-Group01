import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('ly_token'));
  const [loading, setLoading] = useState(false);

  // Decode JWT payload (no verify — just read claims)
  const decodeToken = (t) => {
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload;
    } catch { return null; }
  };

  // Restore user from token on mount
  useEffect(() => {
    if (token) {
      const payload = decodeToken(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser(payload);
      } else {
        // Expired
        localStorage.removeItem('ly_token');
        setToken(null);
      }
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { token: t, expiresAt } = res.data.data;
      localStorage.setItem('ly_token', t);
      setToken(t);
      const payload = decodeToken(t);
      setUser(payload);
      return { ok: true, expiresAt, role: payload?.role };
    } catch (err) {
      const errData = err.response?.data?.error;
      return {
        ok:      false,
        message: errData?.message || 'Login failed',
        issues:  errData?.issues  || [],
      };
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('ly_token');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
