/**
 * AccountCard.jsx — Account summary card
 * Displays account number (masked), balance, status, and quick actions.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatCurrency, maskAccountNumber } from "../lib/format";
import Badge from "./Badge";

export default function AccountCard({ account, onTransfer }) {
  const isFrozen = account.isFrozen;
  const [balanceVisible, setBalanceVisible] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="border border-gray-800 rounded-xl p-4 bg-gray-900 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-brand-900/10"
    >
      {/* Header with number and status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {account.currency || "INR"} Account
          </p>
          <p className="mt-1 font-mono text-sm text-gray-300">
            {maskAccountNumber(account.numberMasked || account._id)}
          </p>
        </div>
        <Badge
          label={isFrozen ? "Frozen" : "Active"}
          variant={isFrozen ? "frozen" : "active"}
          size="xs"
        />
      </div>

      {/* Balance */}
      <div className="mb-4 pb-4 border-b border-gray-800">
        <p className="text-xs text-gray-500 mb-1">Available Balance</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-white">
            {balanceVisible
              ? formatCurrency(account.balance, account.currency)
              : "₹ ••••••"}
          </p>
          <button
            type="button"
            onClick={() => setBalanceVisible((v) => !v)}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1"
            title={balanceVisible ? "Hide balance" : "Show balance"}
            aria-label={balanceVisible ? "Hide balance" : "Show balance"}
          >
            {balanceVisible ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z" clipRule="evenodd" />
                <path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0110 17c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.77-4.228L6.07 8.616A4 4 0 0010.748 13.93z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onTransfer?.(account)}
          disabled={isFrozen}
          className={`
            flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors
            ${
              isFrozen
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-brand-600 text-white hover:bg-brand-500"
            }
          `}
          title={isFrozen ? "Account is frozen" : "Create a transfer"}
        >
          Transfer
        </button>
        <Link
          to={`/accounts/${account._id}`}
          className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-center"
          title="View full account details"
        >
          Details
        </Link>
      </div>
    </motion.div>
  );
}
