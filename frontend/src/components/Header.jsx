/**
 * Header.jsx — Top navigation bar
 * Shows brand logo, user avatar + name, balance hint, and mobile menu toggle.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { isAdmin } from '../lib/auth.js';
import clsx from 'clsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    showToast('Logged out successfully.', 'success');
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-extrabold text-white">B</span>
          <span className="hidden sm:block">BankSys</span>
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
