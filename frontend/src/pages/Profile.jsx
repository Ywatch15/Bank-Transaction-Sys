/**
 * Profile.jsx
 * View and edit the authenticated user's profile.
 * GET /api/profile → PATCH /api/profile
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api, { API_ROUTES } from '../lib/api.js';

function initForm(user) {
  return {
    name:             user?.name            ?? '',
    phoneNumber:      user?.phoneNumber     ?? '',
    dateOfBirth:      user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    'address.street': user?.address?.street  ?? '',
    'address.city':   user?.address?.city    ?? '',
    'address.country':user?.address?.country ?? '',
  };
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm]     = useState(initForm(user));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [edited, setEdited]   = useState(false);

  useEffect(() => { setForm(initForm(user)); }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setEdited(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        name:        form.name,
        phoneNumber: form.phoneNumber  || undefined,
        dateOfBirth: form.dateOfBirth  || undefined,
        address: {
          street:  form['address.street']   || undefined,
          city:    form['address.city']     || undefined,
          country: form['address.country']  || undefined,
        },
      };
      await api.patch(API_ROUTES.profile, payload);
      await refreshUser();
      showToast('Profile updated!', 'success');
      setEdited(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        {/* Avatar header */}
        <div className="mb-6 flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-xl font-bold text-white"
            aria-hidden
          >
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {field('name', 'Full Name', 'text', 'John Doe')}

          <div className="grid gap-4 sm:grid-cols-2">
            {field('phoneNumber', 'Phone Number', 'tel', '+91 00000 00000')}
            {field('dateOfBirth', 'Date of Birth', 'date')}
          </div>

          <hr className="border-gray-800" />
          <p className="text-xs text-gray-500">Address</p>

          <div className="grid gap-4 sm:grid-cols-3">
            {field('address.street',  'Street',  'text', '123 Main St')}
            {field('address.city',    'City',    'text', 'Mumbai')}
            {field('address.country', 'Country', 'text', 'India')}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading || !edited} className="btn-primary">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            {edited && (
              <button
                type="button"
                onClick={() => { setForm(initForm(user)); setEdited(false); }}
                className="btn-secondary"
              >
                Discard
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
