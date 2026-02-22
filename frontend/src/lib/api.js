/**
 * api.js — Axios instance and API endpoint helpers
 * -------------------------------------------------
 * Configuration & endpoint abstraction layer for backend integration.
 *
 * ENV VARIABLES (set in .env or .env.local):
 *   - VITE_API_BASE_URL: Backend base URL (default: '' — uses Vite proxy in dev)
 *   - VITE_USE_COOKIE_AUTH: Set to 'true' if backend uses httpOnly cookies
 *
 * ENDPOINT NOTES:
 *   Backend endpoints:
 *     - /api/auth/login, /api/auth/register, /api/auth/logout
 *     - /api/profile (GET, PATCH)
 *     - /api/account (GET)
 *     - /api/account/:id (GET)
 *     - /api/transactions (GET)
 *     - /api/transactions/transfer (POST)
 *     - /api/transactions/export (GET, blob)
 *     - /api/admin/accounts (GET)
 *     - /api/admin/accounts/:id/freeze (POST)
 *     - /api/admin/accounts/:id/unfreeze (POST)
 *
 *   If your backend uses different paths, update the endpoint strings below.
 */
import axios from 'axios';
import { getToken, clearToken } from './auth.js';

const api = axios.create({
  // Vite proxy forwards /api/* to backend in dev; use baseURL for prod
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  // Enable cookie-based auth if configured
  withCredentials: import.meta.env.VITE_USE_COOKIE_AUTH === 'true',
});

// ── Request interceptor: attach JWT token if using header-based auth
api.interceptors.request.use((config) => {
  if (import.meta.env.VITE_USE_COOKIE_AUTH !== 'true') {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ────── API ROUTE CONSTANTS ──────────────────────────────────
// Centralized endpoint paths for consistency and easy updates

export const API_ROUTES = {
  // Auth
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  
  // Profile
  profile: '/api/profile',
  
  // Accounts
  accounts: '/api/account',
  accountDetail: '/api/account',
  accountBalance: '/api/account/balance',
  
  // Transactions
  transactions: '/api/transactions',
  transactionExport: '/api/transactions/export',
  
  // Admin
  adminAccounts: '/api/admin/accounts',
};

// ────── API ENDPOINT HELPERS ──────────────────────────────────

// AUTH
export const loginAPI = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const registerAPI = (name, email, password, phoneNumber, address, dateOfBirth) =>
  api.post('/api/auth/register', {
    name,
    email,
    password,
    phoneNumber,
    address,
    dateOfBirth,
  });

export const logoutAPI = () => api.post('/api/auth/logout');

// USER PROFILE
export const fetchProfileAPI = () => api.get('/api/profile');

export const updateProfileAPI = (updates) =>
  api.patch('/api/profile', updates);

// ACCOUNTS
export const fetchAccountsAPI = () => api.get('/api/account');

export const fetchAccountDetailAPI = (accountId) =>
  api.get(`/api/account/${accountId}`);

// TRANSACTIONS
export const fetchTransactionsAPI = (params = {}) =>
  api.get('/api/transactions', { params });

export const createTransferAPI = (fromAccountId, toAccountId, amount, note) =>
  api.post('/api/transactions/transfer', {
    fromAccountId,
    toAccountId,
    amount,
    note,
  });

export const exportTransactionsAPI = (params = {}) =>
  api.get('/api/transactions/export', {
    params,
    responseType: 'blob',
  });

// ADMIN
export const fetchAdminAccountsAPI = (params = {}) =>
  api.get('/api/admin/accounts', { params });

export const freezeAccountAPI = (accountId) =>
  api.post(`/api/admin/accounts/${accountId}/freeze`, {});

export const unfreezeAccountAPI = (accountId) =>
  api.post(`/api/admin/accounts/${accountId}/unfreeze`, {});
