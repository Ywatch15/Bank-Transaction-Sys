/**
 * Unauthorized.jsx — 403 page
 * Shown when a non-admin user tries to access /admin.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Unauthorized() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-8xl font-extrabold text-red-600 select-none">403</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to view this page.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-block">
          Back to Dashboard
        </Link>
      </motion.div>
    </main>
  );
}
