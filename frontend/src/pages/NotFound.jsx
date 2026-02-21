/**
 * NotFound.jsx — 404 page
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-8xl font-extrabold text-brand-600 select-none">404</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-block">
          Go to Dashboard
        </Link>
      </motion.div>
    </main>
  );
}
