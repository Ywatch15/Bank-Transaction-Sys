/**
 * Login.jsx
 * Authentication — email + password login.
 * Demo login shortcut shown when VITE_ALLOW_DEMO=true.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api, { API_ROUTES } from '../../lib/api.js';
import { setToken } from '../../lib/auth.js';

const ALLOW_DEMO = import.meta.env.VITE_ALLOW_DEMO === 'true';
const DEMO_EMAIL    = 'demo+alice@example.com';
const DEMO_PASSWORD = 'demopass123';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.email.trim())    e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)         e.password = 'Password is required.';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e, overrideEmail, overridePassword) {
    if (e) e.preventDefault();
    const payload = {
      email:    overrideEmail    ?? form.email,
      password: overridePassword ?? form.password,
    };
    if (!overrideEmail) {
      const errs = validate();
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }

    setLoading(true);
    try {
      const { data } = await api.post(API_ROUTES.login, payload);
      setToken(data.token);
      login(data.user, data.token);
      showToast('Logged in!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid credentials.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-md"
      >
        <h1 className="mb-6 text-2xl font-bold text-white">Sign in to BankSys</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email" name="email" type="email"
              autoComplete="email" autoFocus
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className="input-field"
              aria-describedby={errors.email ? 'email-err' : undefined}
            />
            {errors.email && <p id="email-err" className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password" name="password" type="password"
              autoComplete="current-password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••"
              className="input-field"
              aria-describedby={errors.password ? 'password-err' : undefined}
            />
            {errors.password && <p id="password-err" className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo shortcut */}
        {ALLOW_DEMO && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-700 p-3 text-center">
            <p className="mb-2 text-xs text-gray-500">Demo mode</p>
            <button
              onClick={() => handleSubmit(null, DEMO_EMAIL, DEMO_PASSWORD)}
              disabled={loading}
              className="btn-secondary w-full text-xs"
            >
              Login as Demo User
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          No account?{' '}
          <Link to="/register" className="text-brand-400 hover:underline">Register</Link>
        </p>
      </motion.div>
    </main>
  );
}
