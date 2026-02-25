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
  const [balanceVisible, setBalanceVisible] = useState(false);

  const handleTransfer = (account) => {
    setSelectedAccount(account);
    setTransferOpen(true);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;
  const frozenCount = accounts.filter(
    (a) => a.status === "FROZEN",
  ).length;

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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-white">
              {balanceVisible ? formatCurrency(totalBalance) : "₹ ••••••"}
            </p>
            <button
              type="button"
              onClick={() => setBalanceVisible((v) => !v)}
              className="text-brand-300 hover:text-white transition-colors p-1"
              title={balanceVisible ? "Hide balance" : "Show balance"}
              aria-label={balanceVisible ? "Hide balance" : "Show balance"}
            >
              {balanceVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z"
                    clipRule="evenodd"
                  />
                  <path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0110 17c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.77-4.228L6.07 8.616A4 4 0 0010.748 13.93z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path
                    fillRule="evenodd"
                    d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
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
          <p className="text-2xl font-bold text-red-400 mt-1">{frozenCount}</p>
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
