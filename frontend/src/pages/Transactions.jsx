/**
 * Transactions.jsx
 * Full transaction history: FilterBar, TransactionList, pagination, CSV export.
 * Route: /transactions
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import api, { API_ROUTES } from '../lib/api.js';
import FilterBar from '../components/FilterBar.jsx';
import TransactionList from '../components/TransactionList.jsx';
import { downloadBlob, csvFilename } from '../lib/download.js';

const DEFAULT_FILTERS = {
  startDate: '', endDate: '', type: '', minAmount: '', maxAmount: '',
  sort: 'createdAt:desc', page: 1, limit: 20,
};

export default function Transactions() {
  const { showToast } = useToast();

  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [exporting, setExporting]     = useState(false);
  const [accounts, setAccounts]       = useState([]);

  // Fetch user accounts once for direction logic
  useEffect(() => {
    api.get(API_ROUTES.accounts).then(({ data }) => {
      const list = Array.isArray(data) ? data : (data.accounts ?? []);
      setAccounts(list);
    }).catch(() => {});
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate)   params.endDate   = filters.endDate;
      if (filters.type)      params.type      = filters.type;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;
      if (filters.sort)      params.sort      = filters.sort;
      params.page  = filters.page;
      params.limit = filters.limit;

      const { data } = await api.get(API_ROUTES.transactions, { params });
      setTransactions(data.transactions ?? data ?? []);
      setTotal(data.total ?? data.length ?? 0);
    } catch {
      showToast('Could not load transactions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  async function handleExport() {
    setExporting(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate)   params.endDate   = filters.endDate;
      if (filters.sort)      params.sort      = filters.sort;

      const response = await api.get(API_ROUTES.transactionExport, {
        params,
        responseType: 'blob',
      });
      downloadBlob(response.data, csvFilename('transactions'), 'text/csv');
      showToast('CSV downloaded successfully.', 'success');
    } catch {
      showToast('Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.ceil(total / filters.limit);
  const userAccountIds = new Set(accounts.map((a) => String(a._id)));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Transaction History</h1>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="btn-secondary py-1.5 text-xs"
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Results summary */}
      <p className="text-xs text-gray-500">
        Showing {transactions.length} of {total} transactions
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : (
        <TransactionList transactions={transactions} userAccountIds={userAccountIds} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page <= 1}
            className="btn-secondary py-1.5 text-xs"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-400">
            Page {filters.page} of {totalPages}
          </span>
          <button
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            disabled={filters.page >= totalPages}
            className="btn-secondary py-1.5 text-xs"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
