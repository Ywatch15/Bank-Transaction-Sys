/**
 * AccountCard.jsx
 * Displays an individual account's currency, status, balance, and quick actions.
 *
 * Props:
 *   account  — { _id, currency, status, balance }
 *   onTransfer(account) — called when user clicks "Transfer"
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const STATUS_BADGE = {
  ACTIVE: 'badge-green',
  FROZEN: 'badge-yellow',
  CLOSED: 'badge-red',
};

export default function AccountCard({ account, onTransfer }) {
  const { _id, currency = 'INR', status = 'ACTIVE', balance = 0 } = account;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card flex flex-col gap-4"
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {currency} Account
          </p>
          {/* Partial ID for display */}
          <p className="mt-0.5 font-mono text-xs text-gray-600">
            ···{String(_id).slice(-8)}
          </p>
        </div>
        <span className={clsx(STATUS_BADGE[status] ?? 'badge-yellow')}>
          {status}
        </span>
      </div>

      {/* Balance */}
      <div>
        <p className="text-xs text-gray-500">Balance</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">
          {currency} {Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onTransfer?.(account)}
          disabled={status !== 'ACTIVE'}
          className="btn-primary flex-1 py-2 text-xs"
          aria-label={`Transfer from ${currency} account`}
        >
          Transfer
        </button>
        <Link
          to={`/accounts/${_id}`}
          className="btn-secondary flex-1 py-2 text-center text-xs"
          aria-label={`View details for ${currency} account`}
        >
          Details
        </Link>
      </div>
    </motion.div>
  );
}
