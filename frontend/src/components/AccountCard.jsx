/**
 * AccountCard.jsx — Account summary card
 * Displays account number (masked), balance, status, and quick actions.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, maskAccountNumber } from '../lib/format';
import Badge from './Badge';

export default function AccountCard({ account, onTransfer }) {
  const isFrozen = account.isFrozen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="border border-neutral-200 rounded-lg p-4 bg-white hover:shadow-card-hover transition-shadow"
    >
      {/* Header with number and status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
            {account.currency || 'USD'} Account
          </p>
          <p className="mt-1 font-mono text-sm text-neutral-700">
            {maskAccountNumber(account.numberMasked || account._id)}
          </p>
        </div>
        <Badge
          label={isFrozen ? 'Frozen' : 'Active'}
          variant={isFrozen ? 'frozen' : 'active'}
          size="xs"
        />
      </div>

      {/* Balance */}
      <div className="mb-4 pb-4 border-b border-neutral-100">
        <p className="text-xs text-neutral-500 mb-1">Available Balance</p>
        <p className="text-2xl font-bold text-primary-900">
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onTransfer?.(account)}
          disabled={isFrozen}
          className={`
            flex-1 px-3 py-2 text-sm font-medium rounded transition-colors
            ${isFrozen
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-primary-800 text-white hover:bg-primary-900'
            }
          `}
          title={isFrozen ? 'Account is frozen' : 'Create a transfer'}
        >
          Transfer
        </button>
        <Link
          to={`/accounts/${account._id}`}
          className="flex-1 px-3 py-2 text-sm font-medium rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors text-center"
          title="View full account details"
        >
          Details
        </Link>
      </div>
    </motion.div>
  );
}
