/**
 * Register.jsx
 * Full registration form: name, email, password, phoneNumber, address, dateOfBirth.
 * Mirrors backend express-validator rules for client-side feedback.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api, { API_ROUTES } from '../../lib/api.js';
import { setToken } from '../../lib/auth.js';

function validate(form) {
  const e = {};
  if (!form.name.trim())              e.name     = 'Name is required.';
  if (!form.email.trim())             e.email    = 'Email is required.';
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
  if (!form.password)                 e.password = 'Password is required.';
  else if (form.password.length < 8) e.password = 'Minimum 8 characters.';
  return e;
}

export default function Register() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    phoneNumber: '', dateOfBirth: '',
    'address.street': '', 'address.city': '', 'address.country': '',
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        name:        form.name,
        email:       form.email,
        password:    form.password,
        phoneNumber: form.phoneNumber || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: {
          street:  form['address.street']  || undefined,
          city:    form['address.city']    || undefined,
          country: form['address.country'] || undefined,
        },
      };
      const { data } = await api.post(API_ROUTES.register, payload);
      setToken(data.token);
      login(data.user, data.token);
      showToast('Account created!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const field = (name, label, type = 'text', placeholder = '', required = false) => (
    <div>
      <label htmlFor={name} className="label">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        id={name} name={name} type={type}
        value={form[name]} onChange={handleChange}
        placeholder={placeholder}
        className="input-field"
        aria-describedby={errors[name] ? `${name}-err` : undefined}
      />
      {errors[name] && <p id={`${name}-err`} className="mt-1 text-xs text-red-400">{errors[name]}</p>}
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-lg"
      >
        <h1 className="mb-6 text-2xl font-bold text-white">Create an account</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Required fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name',     'Full Name',  'text',     'John Doe',          true)}
            {field('email',    'Email',      'email',    'you@example.com',   true)}
          </div>
          {field('password', 'Password', 'password', '8+ characters', true)}

          <hr className="border-gray-800" />
          <p className="text-xs text-gray-500">Optional profile information</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {field('phoneNumber',    'Phone Number',  'tel',  '+91 00000 00000')}
            {field('dateOfBirth',    'Date of Birth', 'date', '')}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {field('address.street',  'Street',  'text', '123 Main St')}
            {field('address.city',    'City',    'text', 'Mumbai')}
            {field('address.country', 'Country', 'text', 'India')}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
