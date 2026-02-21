/**
 * TransferForm.jsx
 * Form for initiating a fund transfer.
 * Calls POST /api/transactions/ with { fromAccount, toAccount, amount, idempotencyKey }.
 *
 * NOTE: Backend endpoint is /api/transactions/ (not /api/transactions/transfer).
 *       Change API_ROUTES.transactions in lib/api.js if backend changes.
 *
 * Props:
 *   accounts        — array of user's accounts for fromAccount select
 *   defaultFromId   — pre-select a fromAccount
 *   onSuccess(txn)  — callback after successful transfer
 *   onClose()       — close modal/form
 */
import React, { useState } from 'react';
import api, { API_ROUTES } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

function generateIdempotencyKey() {
  // Simple random key — good enough for client-generated idempotency
  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TransferForm({ accounts = [], defaultFromId = '', onSuccess, onClose }) {
  const { showToast } = useToast();

  const [form, setForm] = useState({
    fromAccount: defaultFromId || accounts[0]?._id || '',
    toAccount:   '',
    amount:      '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.fromAccount) e.fromAccount = 'Select source account.';
    if (!form.toAccount)   e.toAccount = 'Enter destination account ID.';
    if (form.fromAccount === form.toAccount) e.toAccount = 'Source and destination cannot be the same.';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = 'Enter a positive amount.';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const fromAccount = accounts.find((a) => a._id === form.fromAccount);
    if (fromAccount?.status !== 'ACTIVE') {
      setErrors({ fromAccount: 'Source account is not active.' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(API_ROUTES.transactions, {
        fromAccount: form.fromAccount,
        toAccount:   form.toAccount,
        amount:      parseFloat(form.amount),
        idempotencyKey: generateIdempotencyKey(),
      });
      showToast('Transfer completed successfully!', 'success');
      onSuccess?.(data.transaction);
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Transfer failed.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* From account */}
      <div>
        <label htmlFor="fromAccount" className="label">From Account</label>
        <select
          id="fromAccount"
          name="fromAccount"
          value={form.fromAccount}
          onChange={handleChange}
          className="input-field"
          aria-describedby={errors.fromAccount ? 'fromAccount-err' : undefined}
        >
          <option value="" disabled>Select account...</option>
          {activeAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.currency} ···{String(a._id).slice(-6)} (Balance: {a.balance ?? '—'})
            </option>
          ))}
        </select>
        {errors.fromAccount && <p id="fromAccount-err" className="mt-1 text-xs text-red-400">{errors.fromAccount}</p>}
      </div>

      {/* To account ID */}
      <div>
        <label htmlFor="toAccount" className="label">To Account ID</label>
        <input
          id="toAccount"
          name="toAccount"
          type="text"
          value={form.toAccount}
          onChange={handleChange}
          placeholder="Paste destination account ID"
          className="input-field font-mono text-xs"
          aria-describedby={errors.toAccount ? 'toAccount-err' : undefined}
        />
        {errors.toAccount && <p id="toAccount-err" className="mt-1 text-xs text-red-400">{errors.toAccount}</p>}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="label">Amount</label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={handleChange}
          placeholder="0.00"
          className="input-field"
          aria-describedby={errors.amount ? 'amount-err' : undefined}
        />
        {errors.amount && <p id="amount-err" className="mt-1 text-xs text-red-400">{errors.amount}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Sending…' : 'Transfer'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
}
