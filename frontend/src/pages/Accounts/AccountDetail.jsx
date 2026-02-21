/**
 * AccountDetail.jsx
 * View a single account: balance card, transfer form, recent transactions.
 * Route: /accounts/:accountId
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext.jsx';
import api, { API_ROUTES } from '../../lib/api.js';
import TransactionList from '../../components/TransactionList.jsx';
import TransferForm from '../../components/TransferForm.jsx';
import clsx from 'clsx';

export default function AccountDetail() {
  const { accountId } = useParams();
  const { showToast } = useToast();

  const [account, setAccount]     = useState(null);
  const [allAccounts, setAllAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);

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
      const list = Array.isArray(acctRes.data) ? acctRes.data : (acctRes.data.accounts ?? []);
      setAllAccounts(list);
      const txns = txnRes.data?.transactions ?? txnRes.data ?? [];
      // Filter to this account
      setTransactions(txns.filter((t) =>
        String(t.fromAccount?._id ?? t.fromAccount) === accountId ||
        String(t.toAccount?._id   ?? t.toAccount)   === accountId
      ));
    } catch {
      showToast('Could not load account details.', 'error');
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
      <Link to="/dashboard" className="text-sm text-brand-400 hover:underline">← Back to Dashboard</Link>

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
                {account.currency ?? 'INR'} Account
              </p>
              <p className="font-mono text-xs text-gray-600">
                ···{String(accountId).slice(-8)}
              </p>
            </div>
            <span className={clsx(
              account.status === 'ACTIVE' ? 'badge-green' :
              account.status === 'FROZEN' ? 'badge-yellow' : 'badge-red'
            )}>
              {account.status}
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tabular-nums text-white">
            {account.currency ?? 'INR'}&nbsp;
            {Number(account.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>

          <div className="mt-4">
            <button
              onClick={() => setShowTransfer((v) => !v)}
              disabled={account.status !== 'ACTIVE'}
              className="btn-primary"
            >
              {showTransfer ? 'Cancel Transfer' : 'Transfer Funds'}
            </button>
          </div>

          {showTransfer && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <TransferForm
                accounts={allAccounts.filter((a) => a.status === 'ACTIVE')}
                defaultFromId={accountId}
                onSuccess={() => { fetchAll(); setShowTransfer(false); }}
                onClose={() => setShowTransfer(false)}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Recent transactions */}
      <section aria-labelledby="recent-txn-heading">
        <h2 id="recent-txn-heading" className="mb-3 text-base font-semibold text-white">
          Recent Transactions
        </h2>
        <TransactionList transactions={transactions} userAccountIds={userAccountIds} />
      </section>
    </div>
  );
}
