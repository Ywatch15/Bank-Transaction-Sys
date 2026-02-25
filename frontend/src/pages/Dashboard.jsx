/**
 * Dashboard.jsx — Main dashboard with accounts overview and recent transactions
 * Displays account cards, recent ledger, and quick transfer access.
 */
import React, { useState, useEffect } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { useTransactions } from "../hooks/useTransactions";
import { useAuth } from "../hooks/useAuth";
import AccountCard from "../components/AccountCard";
import LedgerTable, {
  getDefaultLedgerColumns,
} from "../components/LedgerTable";
import TransferModal from "../components/TransferModal";
import { formatCurrency } from "../lib/format";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const {
    transactions,
    loading: transLoading,
    fetch: fetchTransactions,
  } = useTransactions();
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your accounts and transactions
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <div className="rounded-xl p-6 bg-gradient-to-br from-brand-800/80 to-brand-900/80 border border-brand-700/40">
          <p className="text-xs font-medium text-brand-200 uppercase tracking-wide">
            Total Balance
          </p>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        <div className="rounded-xl p-6 border border-gray-800 bg-gray-900">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Accounts
          </p>
          <p className="text-2xl font-bold text-white mt-2">
            {accounts.length}
          </p>
        </div>

        <div className="rounded-xl p-6 border border-gray-800 bg-gray-900">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Frozen Accounts
          </p>
          <p className="text-2xl font-bold text-debit-400 mt-2">
            {frozenCount}
          </p>
        </div>
      </motion.div>

      {/* Accounts Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">
          Your Accounts
        </h2>
        {accountsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-gray-500">No accounts yet</p>
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
          <h2 className="text-xl font-semibold text-white">
            Recent Transactions
          </h2>
          <a
            href="/transactions"
            className="text-sm text-brand-400 hover:text-brand-300 font-medium"
          >
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
