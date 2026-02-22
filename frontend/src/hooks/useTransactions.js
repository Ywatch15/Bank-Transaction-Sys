/**
 * useTransactions.js — Hook for managing transactions
 * Provides paginated transaction data with filters.
 */
import { useState, useCallback } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

export function useTransactions(initialFilters = {}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const { showToast } = useToast();

  const fetch = useCallback(async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/transactions', {
        params: {
          page,
          limit: pagination.limit,
          ...filters,
        },
      });
      setTransactions(Array.isArray(data.data) ? data.data : []);
      setPagination({
        page: data.page || page,
        limit: data.limit || pagination.limit,
        total: data.total || 0,
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, showToast]);

  // Load first page on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialFetch = useCallback(() => fetch(initialFilters, 1), []);

  return {
    transactions,
    loading,
    error,
    pagination,
    fetch,
    initialFetch,
  };
}

/**
 * Hook for creating a transfer
 */
export function useCreateTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const execute = useCallback(async (fromAccountId, toAccountId, amount, note) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/transactions/transfer', {
        fromAccountId,
        toAccountId,
        amount,
        note,
      });
      showToast('Transfer successful!', 'success');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Transfer failed';
      setError(message);
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return { execute, loading, error };
}

/**
 * Hook for exporting transactions to CSV
 */
export function useExportTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const execute = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/transactions/export', {
        params: filters,
        responseType: 'blob',
      });
      // Trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Export successful', 'success');
      return data;
    } catch (err) {
      const message = 'Export failed';
      setError(message);
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return { execute, loading, error };
}
