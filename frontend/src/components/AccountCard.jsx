/**
 * AccountCard.jsx — Account summary card
 * Displays account number (masked), balance, status, and quick actions.
 */
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatCurrency, maskAccountNumber } from "../lib/format";
import Badge from "./Badge";

export default function AccountCard({ account, onTransfer }) {
  const isFrozen = account.isFrozen;

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
        <p className="text-2xl font-bold text-white">
          {formatCurrency(account.balance, account.currency)}
        </p>
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
