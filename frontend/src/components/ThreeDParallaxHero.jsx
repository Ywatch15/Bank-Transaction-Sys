/**
 * ThreeDParallaxHero.jsx
 * ----------------------
 * A subtle 3D parallax scene using react-three-fiber + drei.
 * The geometry reacts to cursor/pointer movement for a floating parallax feel.
 * framer-motion overlays provide the CTA buttons and balance display.
 *
 * Accessibility:
 *   - Wrapped in React.Suspense with a static gradient fallback.
 *   - Respects `prefers-reduced-motion` and `VITE_DISABLE_ANIMATIONS` env var.
 *   - Canvas has role="img" and aria-label for screen readers.
 *
 * Performance:
 *   - The Canvas (and Three.js bundle) is lazy-loaded; excluded from initial chunk.
 *   - On mobile (<768px) the 3D scene is replaced with the static fallback.
 */
import React, { useRef, useState, useEffect, Suspense, lazy } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ── Lazy-import heavy 3D deps so they are code-split ────────
const Scene3D = lazy(() => import('./Scene3DInner.jsx'));

// Whether animations are globally disabled by env var
const ANIMATIONS_DISABLED = import.meta.env.VITE_DISABLE_ANIMATIONS === 'true';

/** Static gradient fallback shown when 3D is disabled / not supported */
function StaticHero({ children }) {
  return (
    <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-gray-900 to-gray-950">
      {/* Decorative circles */}
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand-800/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" aria-hidden />
      {children}
    </div>
  );
}

/** Content overlay (buttons, greeting) — rendered on top of 3D or fallback */
function HeroOverlay({ user }) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold text-white sm:text-3xl"
      >
        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-sm text-sm text-gray-400"
      >
        Manage accounts, track transactions, and transfer funds securely.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-3"
      >
        <Link to="/transactions" className="btn-primary">View Transactions</Link>
        <Link to="/profile" className="btn-secondary">My Profile</Link>
      </motion.div>
    </div>
  );
}

export default function ThreeDParallaxHero({ user }) {
  const prefersReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const disable3D = ANIMATIONS_DISABLED || prefersReduced || isMobile;

  if (disable3D) {
    return (
      <StaticHero>
        <HeroOverlay user={user} />
      </StaticHero>
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl">
      <Suspense
        fallback={
          <StaticHero>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </StaticHero>
        }
      >
        <Scene3D />
      </Suspense>
      {/* UI overlay on top of canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <HeroOverlay user={user} />
      </div>
    </div>
  );
}
