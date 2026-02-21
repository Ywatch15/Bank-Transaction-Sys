/**
 * Dashboard.jsx
 * Main landing page after login.
 * Shows: 3D parallax hero, account cards grid, quick-action transfer modal.
 */
import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api, { API_ROUTES } from '../lib/api.js';
import ThreeDParallaxHero from '../components/ThreeDParallaxHero.jsx';
import AccountCard from '../components/AccountCard.jsx';
import TransferForm from '../components/TransferForm.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [accounts, setAccounts]       = useState([]);
  const [loadingAccts, setLoadingAccts] = useState(true);
  const [transferAccount, setTransferAccount] = useState(null); // opens modal

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAccounts() {
    setLoadingAccts(true);
    try {
      const { data } = await api.get(API_ROUTES.accounts);
      // Backend GET /api/account returns { accounts: [...] } or array — handle both
      const list = Array.isArray(data) ? data : (data.accounts ?? []);
      setAccounts(list);
    } catch {
      showToast('Could not load accounts.', 'error');
    } finally {
      setLoadingAccts(false);
    }
  }

  function handleTransferSuccess() {
    fetchAccounts(); // refresh balances
    setTransferAccount(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Hero */}
      <ThreeDParallaxHero user={user} />

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
