import React, { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header.jsx";
import MobileNav from "./components/MobileNav.jsx";
import Toast from "./components/Toast.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

// ── Eagerly loaded (small / critical path) ───────────────────
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";

// ── Lazy-loaded (code-split) ─────────────────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AccountsList = lazy(() => import("./pages/Accounts/AccountsList.jsx"));
const AccountDetail = lazy(() => import("./pages/Accounts/AccountDetail.jsx"));
const Transactions = lazy(() => import("./pages/Transactions.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard.jsx"));

// Simple full-screen spinner shown during lazy-load
function PageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
    </div>
  );
}

export default function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMobileNavOpen={() => setMobileNavOpen(true)} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
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
              <Route path="/accounts" element={<AccountsList />} />
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

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-500 mt-12">
        © {new Date().getFullYear()} Bank Transaction System — Professional
        Banking System
      </footer>
    </div>
  );
}
