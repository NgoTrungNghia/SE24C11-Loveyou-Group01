import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../utils/api';
import { disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('ly_token'));
  const [loading, setLoading] = useState(false);

  // Decode JWT payload with proper UTF-8 support
  const decodeToken = (t) => {
    try {
      const base64Url = t.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const binaryStr = atob(base64);
      const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
      const decodedString = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(decodedString);
    } catch { return null; }
  };

  // Restore user from token on mount and listen to multi-tab storage changes
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

    const handleStorageChange = (e) => {
      if (e.key === 'ly_token') {
        const newToken = e.newValue;
        if (newToken) {
          const payload = decodeToken(newToken);
          if (payload && payload.exp * 1000 > Date.now()) {
            setToken(newToken);
            setUser(payload);
          } else {
            setToken(null);
            setUser(null);
          }
        } else {
          setToken(null);
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    disconnectSocket();
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
