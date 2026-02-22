/**
 * Header.jsx — Professional banking header
 * Shows logo, navigation, user menu, and balance snapshot.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdmin } from '../lib/auth';
import { motion } from 'framer-motion';

export default function Header() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold">
          <div className="w-8 h-8 bg-primary-800 rounded-md flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="hidden sm:inline text-primary-900">Bank System</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-sm text-neutral-700 hover:text-primary-800 font-medium transition-colors">
            Dashboard
          </Link>
          <Link to="/accounts" className="text-sm text-neutral-700 hover:text-primary-800 font-medium transition-colors">
            Accounts
          </Link>
          <Link to="/transactions" className="text-sm text-neutral-700 hover:text-primary-800 font-medium transition-colors">
            Transactions
          </Link>
          {isAdmin(user) && (
            <Link to="/admin" className="text-sm text-neutral-700 hover:text-primary-800 font-medium transition-colors">
              Admin
            </Link>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center max-w-xs gap-2">
              <div className="text-right">
                <p className="text-xs font-medium text-neutral-900 truncate">{user.name}</p>
                <p className="text-xs text-neutral-500">{user.email}</p>
              </div>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-sm hover:bg-primary-200 transition-colors"
              title={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 z-50"
              >
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
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
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            {isAdmin(user) && (
              <NavLink to="/admin" className="text-yellow-400 hover:text-yellow-300">Admin</NavLink>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-400 md:block">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary py-1.5 text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary py-1.5 text-xs">Login</Link>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-700 md:hidden"
            >
              <span className={clsx('h-0.5 w-5 bg-gray-300 transition-all', menuOpen && 'translate-y-2 rotate-45')} />
              <span className={clsx('h-0.5 w-5 bg-gray-300 transition-all', menuOpen && 'opacity-0')} />
              <span className={clsx('h-0.5 w-5 bg-gray-300 transition-all', menuOpen && '-translate-y-2 -rotate-45')} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav (inline below header) */}
      {user && menuOpen && (
        <nav className="border-t border-gray-800 bg-gray-950 px-4 pb-4 md:hidden" aria-label="Mobile navigation">
          <MobileLinks onClose={() => setMenuOpen(false)} user={user} onLogout={handleLogout} />
        </nav>
      )}
    </header>
  );
}

function NavLink({ to, children, className }) {
  return (
    <Link
      to={to}
      className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 transition hover:bg-gray-800 hover:text-white', className)}
    >
      {children}
    </Link>
  );
}

function MobileLinks({ onClose, user, onLogout }) {
  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/profile', label: 'Profile' },
    ...(isAdmin(user) ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <ul className="mt-3 space-y-1">
      {links.map((l) => (
        <li key={l.to}>
          <Link
            to={l.to}
            onClick={onClose}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            {l.label}
          </Link>
        </li>
      ))}
      <li>
        <button
          onClick={onLogout}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 hover:bg-gray-800"
        >
          Logout
        </button>
      </li>
    </ul>
  );
}
