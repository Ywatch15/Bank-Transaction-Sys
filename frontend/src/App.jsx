import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header.jsx';
import MobileNav from './components/MobileNav.jsx';
import Toast from './components/Toast.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

// ── Eagerly loaded (small / critical path) ───────────────────
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import NotFound from './pages/NotFound.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

// ── Lazy-loaded (code-split) ─────────────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const AccountDetail = lazy(() => import('./pages/Accounts/AccountDetail.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard.jsx'));

// Simple full-screen spinner shown during lazy-load
function PageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MobileNav />
      <Toast />

      {/* Main content area */}
      <main className="flex-1">
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Auth-protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts/:accountId" element={<AccountDetail />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Bank Transaction System
      </footer>
    </div>
  );
}
