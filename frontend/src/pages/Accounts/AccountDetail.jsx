/**
 * AccountDetail.jsx
 * View a single account: balance card, transfer form, recent transactions.
 * Route: /accounts/:accountId
 */
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../../context/ToastContext.jsx";
import api, { API_ROUTES } from "../../lib/api.js";
import TransactionList from "../../components/TransactionList.jsx";
import TransferForm from "../../components/TransferForm.jsx";
import clsx from "clsx";

export default function AccountDetail() {
  const { accountId } = useParams();
  const { showToast } = useToast();

  const [account, setAccount] = useState(null);
  const [allAccounts, setAllAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [balRes, acctRes, txnRes] = await Promise.all([
        api.get(`${API_ROUTES.accountBalance}/${accountId}`),
        api.get(API_ROUTES.accounts),
        api.get(API_ROUTES.transactions, { params: { limit: 10 } }),
      ]);

      setAccount(balRes.data);
      const list = Array.isArray(acctRes.data)
        ? acctRes.data
        : (acctRes.data.accounts ?? []);
      setAllAccounts(list);
      // Backend wraps in successResponse: { success, data: { transactions, meta } }
      const txnPayload = txnRes.data?.data || txnRes.data;
      const txns =
        txnPayload?.transactions ??
        (Array.isArray(txnPayload) ? txnPayload : []);
      // Filter to this account
      setTransactions(
        txns.filter(
          (t) =>
            String(t.fromAccount?._id ?? t.fromAccount) === accountId ||
            String(t.toAccount?._id ?? t.toAccount) === accountId,
        ),
      );
    } catch {
      showToast("Could not load account details.", "error");
    } finally {
      setLoading(false);
    }
  }

  const userAccountIds = new Set(allAccounts.map((a) => String(a._id)));

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-32 animate-pulse rounded-xl bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Back */}
      <Link to="/dashboard" className="text-sm text-brand-400 hover:underline">
        ← Back to Dashboard
      </Link>

      {/* Account summary card */}
      {account && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {account.currency ?? "INR"} Account
              </p>
              <p className="font-mono text-xs text-gray-600">
                ···{String(accountId).slice(-8)}
              </p>
            </div>
            <span
              className={clsx(
                account.status === "ACTIVE"
                  ? "badge-green"
                  : account.status === "FROZEN"
                    ? "badge-yellow"
                    : "badge-red",
              )}
            >
              {account.status}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <p className="text-3xl font-bold tabular-nums text-white">
              {balanceVisible
                ? `${account.currency ?? "INR"}\u00A0${Number(account.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
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
                  className="w-5 h-5"
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

          <div className="mt-4">
            <button
              onClick={() => setShowTransfer((v) => !v)}
              disabled={account.status !== "ACTIVE"}
              className="btn-primary"
            >
              {showTransfer ? "Cancel Transfer" : "Transfer Funds"}
            </button>
          </div>

          {showTransfer && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <TransferForm
                accounts={allAccounts.filter((a) => a.status === "ACTIVE")}
                defaultFromId={accountId}
                onSuccess={() => {
                  fetchAll();
                  setShowTransfer(false);
                }}
                onClose={() => setShowTransfer(false)}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Recent transactions */}
      <section aria-labelledby="recent-txn-heading">
        <h2
          id="recent-txn-heading"
          className="mb-3 text-base font-semibold text-white"
        >
          Recent Transactions
        </h2>
        <TransactionList
          transactions={transactions}
          userAccountIds={userAccountIds}
        />
      </section>
    </div>
  );
}
