/**
 * AccountsList.jsx — All user accounts overview
 * Route: /accounts
 */
import React, { useState } from "react";
import { useAccounts } from "../../hooks/useAccounts";
import AccountCard from "../../components/AccountCard";
import TransferModal from "../../components/TransferModal";
import { formatCurrency } from "../../lib/format";
import { motion } from "framer-motion";

export default function AccountsList() {
  const { accounts, loading } = useAccounts();
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleTransfer = (account) => {
    setSelectedAccount(account);
    setTransferOpen(true);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;
  const frozenCount = accounts.filter((a) => a.status === "FROZEN" || a.isFrozen).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white">Your Accounts</h1>
        <p className="text-gray-400 mt-1">
          Manage and monitor all your bank accounts
        </p>
      </motion.div>

      {/* Summary Strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        <div className="rounded-xl p-5 bg-gradient-to-br from-brand-800/80 to-brand-900/80 border border-brand-700/40">
          <p className="text-xs font-medium text-brand-200 uppercase tracking-wide">
            Combined Balance
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="rounded-xl p-5 border border-gray-800 bg-gray-900">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Active
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl p-5 border border-gray-800 bg-gray-900">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Frozen
          </p>
          <p className="text-2xl font-bold text-red-400 mt-1">
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-5xl mb-3">🏦</p>
            <p className="text-gray-400 text-lg font-medium">No accounts yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Your accounts will appear here once created
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account, idx) => (
              <motion.div
                key={account._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <AccountCard account={account} onTransfer={handleTransfer} />
              </motion.div>
            ))}
          </div>
        )}
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
            setTransferOpen(false);
            setSelectedAccount(null);
          }}
        />
      )}
    </div>
  );
}
