/**
 * MobileNav.jsx — Slide-in overlay navigation for small screens.
 * Triggered externally; kept separate from Header for flexibility.
 * Currently Header handles its own mobile nav inline.
 * This component can be used as a standalone side drawer if needed.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdmin } from '../lib/auth.js';

export default function MobileNav({ open, onClose }) {
  const { user } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/transactions', label: 'Transactions', icon: '💸' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    ...(user && isAdmin(user) ? [{ to: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.nav
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 px-6 py-8 shadow-2xl md:hidden"
            aria-label="Side navigation"
          >
            <p className="mb-8 text-lg font-bold text-white">BankSys</p>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <span aria-hidden>{l.icon}</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
