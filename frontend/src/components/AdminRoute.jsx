/**
 * AdminRoute
 * Extends ProtectedRoute — also requires user.isAdmin === true.
 * Non-admins are redirected to /unauthorized.
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdmin } from '../lib/auth.js';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
