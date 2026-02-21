/**
 * AdminDashboard.jsx
 * Admin-only page: list all user accounts with freeze / unfreeze controls.
 * Route: /admin — protected by AdminRoute
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext.jsx';
import api, { API_ROUTES } from '../../lib/api.js';
import clsx from 'clsx';

const STATUS_CLS = {
  ACTIVE: 'badge-green',
  FROZEN: 'badge-yellow',
  CLOSED: 'badge-red',
};

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null); // account being actioned

  useEffect(() => { fetchAccounts(); }, []);

  async function fetchAccounts() {
    setLoading(true);
    try {
      // Use the regular accounts route; admin middleware on the backend allows full list
      const { data } = await api.get(API_ROUTES.accounts);
      const list = Array.isArray(data) ? data : (data.accounts ?? []);
      setAccounts(list);
    } catch (err) {
      showToast('Could not load accounts.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleFreeze(accountId) {
    setActionId(accountId);
    try {
      await api.patch(`${API_ROUTES.adminFreeze}/${accountId}/freeze`);
      showToast('Account frozen.', 'success');
      setAccounts((prev) => prev.map((a) => a._id === accountId ? { ...a, status: 'FROZEN' } : a));
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Action failed.', 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleUnfreeze(accountId) {
    setActionId(accountId);
    try {
      await api.patch(`${API_ROUTES.adminFreeze}/${accountId}/unfreeze`);
      showToast('Account unfrozen.', 'success');
      setAccounts((prev) => prev.map((a) => a._id === accountId ? { ...a, status: 'ACTIVE' } : a));
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Action failed.', 'error');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-gray-500">No accounts found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="min-w-full divide-y divide-gray-800 text-sm">
            <thead className="bg-gray-900">
              <tr>
                {['Account ID', 'Owner', 'Currency', 'Balance', 'Status', 'Actions'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {accounts.map((acct) => (
                <motion.tr
                  key={acct._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    ···{String(acct._id).slice(-8)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {acct.user?.name ?? acct.user ?? '—'}
                    {acct.user?.email && (
                      <span className="ml-1 text-xs text-gray-600">{acct.user.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{acct.currency}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-300">
                    {Number(acct.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(STATUS_CLS[acct.status] ?? 'badge-yellow')}>
                      {acct.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {acct.status !== 'FROZEN' ? (
                        <button
                          onClick={() => handleFreeze(acct._id)}
                          disabled={actionId === acct._id}
                          className="btn-danger py-1 text-xs"
                        >
                          {actionId === acct._id ? '…' : 'Freeze'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnfreeze(acct._id)}
                          disabled={actionId === acct._id}
                          className="btn-secondary py-1 text-xs"
                        >
                          {actionId === acct._id ? '…' : 'Unfreeze'}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
