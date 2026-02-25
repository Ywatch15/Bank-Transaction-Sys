/**
 * AuthContext — Authentication state management
 * -----------------------------------------------
 * Provides user, loading state, and auth helpers (login, logout, refreshUser).
 *
 * Token storage strategy:
 *   - DEFAULT: localStorage (XSS risk — recommended only for dev/demo)
 *   - PRODUCTION: Use httpOnly cookies set by backend. Disable token interceptor
 *     in api.js and rely on `withCredentials: true` for automatic cookie inclusion.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getToken, setToken, clearToken, decodeToken } from "../lib/auth.js";
import {
  fetchProfileAPI,
  loginAPI,
  registerAPI,
  logoutAPI,
} from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from stored token
  useEffect(() => {
    let cancelled = false;

    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        // Fetch fresh user profile
        fetchProfileAPI()
          .then(({ data }) => {
            if (!cancelled) {
              setUser(data.user || data);
            }
          })
          .catch(() => {
            if (!cancelled) {
              clearToken();
            }
          })
          .finally(() => {
            if (!cancelled) {
              setLoading(false);
            }
          });
      } else {
        clearToken();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    // Cleanup: mark as cancelled if component unmounts before promise resolves
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((userData, token) => {
    if (token) setToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAPI();
    } catch {
      // Ignore errors — clear client side regardless
    }
    clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await fetchProfileAPI();
    setUser(data.user || data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
