/**
 * Dashboard.jsx — Main dashboard with accounts overview and recent transactions
 * Displays account cards, recent ledger, and quick transfer access.
 */
import React, { useState, useEffect } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import AccountCard from '../components/AccountCard';
import LedgerTable, { getDefaultLedgerColumns } from '../components/LedgerTable';
import TransferModal from '../components/TransferModal';
import { formatCurrency } from '../lib/format';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transLoading, fetch: fetchTransactions } = useTransactions();
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Load recent transactions on mount
  useEffect(() => {
    fetchTransactions({ limit: 10 }, 1);
  }, []);

  const handleTransfer = (account) => {
    setSelectedAccount(account);
    setTransferOpen(true);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const frozenCount = accounts.filter((a) => a.isFrozen).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-neutral-900">
          Welcome back, {user?.name}
        </h1>
        <p className="text-neutral-600 mt-1">Manage your accounts and transactions</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Total Balance</p>
          <p className="text-2xl font-bold text-primary-900 mt-2">{formatCurrency(totalBalance)}</p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Accounts</p>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{accounts.length}</p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 bg-white">
          <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Frozen Accounts</p>
          <p className="text-2xl font-bold text-debit-600 mt-2">{frozenCount}</p>
        </div>
      </motion.div>

      {/* Accounts Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Your Accounts</h2>
        {accountsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
            <p className="text-neutral-600">No accounts yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account._id}
                account={account}
                onTransfer={handleTransfer}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* Recent Transactions */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Recent Transactions</h2>
          <a href="/transactions" className="text-sm text-primary-800 hover:text-primary-900 font-medium">
            View All →
          </a>
        </div>
        <LedgerTable
          data={transactions}
          columns={getDefaultLedgerColumns()}
          isLoading={transLoading}
          striped
        />
      </motion.section>

      {/* Transfer Modal */}
      {selectedAccount && (
        <TransferModal
          isOpen={transferOpen}
          onClose={() => {
            setTransferOpen(false);
            setSelectedAccount(null);
          }}
          fromAccount={selectedAccount}
          accounts={accounts}
          onSuccess={() => {
            // Refresh accounts and transactions
            fetchTransactions({ limit: 10 }, 1);
          }}
        />
      )}
    </div>
  );
}

      {/* Account cards */}
      <section aria-labelledby="accounts-heading">
        <h2 id="accounts-heading" className="mb-4 text-lg font-semibold text-white">
          Your Accounts
        </h2>

        {loadingAccts ? (
          <div className="flex gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-44 flex-1 animate-pulse rounded-xl bg-gray-800" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-gray-500">No accounts found.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {accounts.map((acct) => (
              <li key={acct._id}>
                <AccountCard account={acct} onTransfer={setTransferAccount} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Transfer modal */}
      {transferAccount && (
        <Modal title="New Transfer" onClose={() => setTransferAccount(null)}>
          <TransferForm
            accounts={accounts}
            defaultFromId={transferAccount._id}
            onSuccess={handleTransferSuccess}
            onClose={() => setTransferAccount(null)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ── Inline lightweight Dialog ───────────────────────────── */
function Modal({ title, onClose, children }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    >
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white" aria-label="Close modal">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
