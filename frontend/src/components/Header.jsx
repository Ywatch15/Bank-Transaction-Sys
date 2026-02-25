/**
 * Header.jsx — Professional banking header
 * Shows logo, navigation, user menu, and balance snapshot.
 */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isAdmin } from "../lib/auth";
import { motion } from "framer-motion";

export default function Header({ onMobileNavOpen }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    showToast("Logged out successfully", "success");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 font-bold shrink-0"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            B
          </div>
          <span className="hidden sm:inline text-lg font-bold text-white tracking-tight">
            BankSys
          </span>
        </Link>

        {/* Mobile hamburger button */}
        <button
          onClick={onMobileNavOpen}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
          aria-label="Open navigation menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 bg-gray-800/60 rounded-lg px-1 py-1">
          <Link
            to="/dashboard"
            className="text-sm text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors px-3 py-1.5 rounded-md"
          >
            Dashboard
          </Link>
          <Link
            to="/accounts"
            className="text-sm text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors px-3 py-1.5 rounded-md"
          >
            Accounts
          </Link>
          <Link
            to="/transactions"
            className="text-sm text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors px-3 py-1.5 rounded-md"
          >
            Transactions
          </Link>
          {isAdmin(user) && (
            <Link
              to="/admin"
              className="text-sm text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors px-3 py-1.5 rounded-md"
            >
              Admin
            </Link>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <div className="hidden sm:flex items-center max-w-xs gap-2">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-200 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm hover:bg-brand-500 transition-colors ring-2 ring-brand-500/30"
              title={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50"
              >
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
