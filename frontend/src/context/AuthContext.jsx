/**
 * AuthContext
 * -----------
 * Provides authentication state (user, token) and helpers (login, logout)
 * to the whole app via React context.
 *
 * Token storage strategy:
 *   - PREFERRED: If the backend sets an httpOnly cookie on login, Axios will
 *     carry it automatically when `withCredentials: true` is set in api.js.
 *     In that case the token never touches JS / localStorage.
 *   - FALLBACK: If the backend returns the token in the JSON response body
 *     (current implementation), we store it in localStorage.
 *     Trade-off: XSS risk — mitigate by keeping CSP strict & sanitising inputs.
 *     Swap to httpOnly cookies for production hardening.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken, clearToken, decodeToken } from '../lib/auth.js';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we're restoring session from stored token
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session from stored token
  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        // Fetch fresh user profile using stored token
        api.get('/api/profile')
          .then(({ data }) => setUser(data.user))
          .catch(() => clearToken())  // token expired/invalid → clear it
          .finally(() => setLoading(false));
      } else {
        clearToken();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  /** Call after a successful login API response */
  const login = useCallback((userData, token) => {
    if (token) setToken(token);
    setUser(userData);
  }, []);

  /** Clear session client-side; backend invalidates token separately */
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network errors — clear client side regardless
    }
    clearToken();
    setUser(null);
  }, []);

  /** Re-fetch user profile from backend (e.g. after profile update) */
  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/api/profile');
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook: access auth state anywhere */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
