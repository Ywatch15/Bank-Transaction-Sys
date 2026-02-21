/**
 * api.js — Axios instance for all backend calls
 * -----------------------------------------------
 * Important notes:
 *
 * 1. BASE URL: Reads VITE_API_BASE_URL from env.
 *    In dev, the Vite proxy (vite.config.js) forwards /api/* calls to the
 *    backend, so baseURL can be empty string ''. Set VITE_API_BASE_URL fully
 *    only when not using the proxy (e.g. staging builds).
 *
 * 2. TOKEN ATTACHMENT: We pull the JWT from localStorage (fallback strategy).
 *    If the backend switches to httpOnly cookies, remove the interceptor below
 *    and keep `withCredentials: true` so the browser sends the cookie automatically.
 *
 * 3. 401 HANDLING: Any 401 response triggers a client-side logout and redirect.
 *
 * NOTE ON ENDPOINT NAMES:
 *   The backend uses /api/account (singular) for accounts,
 *   and /api/profile for user profile.
 *   Adjust API_ROUTES constants below if the backend changes.
 */
import axios from 'axios';
import { getToken, clearToken } from './auth.js';

// ── Configurable endpoint names ──────────────────────────────
// Change these constants if the backend renames routes.
export const API_ROUTES = {
  login:           '/api/auth/login',
  register:        '/api/auth/register',
  logout:          '/api/auth/logout',
  profile:         '/api/profile',          // GET + PATCH
  accounts:        '/api/account',          // Note: backend uses singular
  accountBalance:  '/api/account/balance',  // + /:accountId
  transactions:    '/api/transactions',
  transactionExport: '/api/transactions/export',
  adminFreeze:     '/api/admin/accounts',   // + /:id/freeze | /unfreeze
};

const api = axios.create({
  /**
   * When using the Vite dev proxy, leave baseURL as '' so requests go to
   * the same origin and the proxy picks them up.
   * For production builds, set VITE_API_BASE_URL to the full backend URL.
   */
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  /**
   * Set withCredentials: true to send httpOnly cookies with each request.
   * Safe to leave enabled even when using localStorage tokens.
   */
  withCredentials: true,
});

// ── Request interceptor — attach JWT ─────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 globally ───────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear local state and redirect to login.
      // We avoid importing AuthContext here to prevent circular deps.
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
