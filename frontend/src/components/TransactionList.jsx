/**
 * TransactionList.jsx
 * Renders a list of transaction rows.
 * Each row shows: type (credit/debit), amount (colour-coded), date, status.
 *
 * Props:
 *   transactions — array from GET /api/transactions .data
 *   currentUserId — to determine credit vs debit direction
 *   userAccountIds — Set of the user's account IDs for direction logic
 */
import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatAmount(amount, currency = 'INR') {
  return `${currency} ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

const STATUS_CLS = {
  COMPLETED: 'badge-green',
  PENDING:   'badge-yellow',
  FAILED:    'badge-red',
  REVERSED:  'badge-yellow',
};

export default function TransactionList({ transactions = [], userAccountIds = new Set() }) {
  if (!transactions.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-800 px-6 py-12 text-center text-sm text-gray-600">
        No transactions found.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800 overflow-hidden" role="list">
      {transactions.map((txn, idx) => {
        // Determine direction relative to this user's accounts
        const isCredit = userAccountIds.has(String(txn.toAccount?._id ?? txn.toAccount));
        const direction = isCredit ? 'CREDIT' : 'DEBIT';

        return (
          <motion.li
            key={txn._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
            className="flex items-center justify-between gap-4 bg-gray-900 px-4 py-3 hover:bg-gray-800/50"
          >
            {/* Left: direction badge + meta */}
            <div className="flex items-center gap-3 min-w-0">
              <span
                aria-label={direction}
                className={clsx(
                  'shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                  direction === 'CREDIT'
                    ? 'bg-emerald-900/60 text-emerald-400'
                    : 'bg-red-900/60 text-red-400'
                )}
              >
                {direction === 'CREDIT' ? '↓' : '↑'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-200">
                  {direction === 'CREDIT' ? 'Received' : 'Sent'}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {formatDate(txn.createdAt)}
                </p>
              </div>
            </div>

            {/* Right: amount + status */}
            <div className="shrink-0 text-right">
              <p
                className={clsx(
                  'text-sm font-semibold tabular-nums',
                  direction === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {direction === 'CREDIT' ? '+' : '−'}
                {formatAmount(txn.amount)}
              </p>
              <span className={clsx('mt-0.5 inline-block', STATUS_CLS[txn.status] ?? 'badge-yellow')}>
                {txn.status}
              </span>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
