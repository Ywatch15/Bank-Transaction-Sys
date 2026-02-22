/**
 * useAccounts.js — Hook for fetching and managing accounts
 * Provides cached account data and refetch capability.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/account');
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
}

/**
 * useAccountDetail.js — Hook for a specific account
 */
export function useAccountDetail(accountId) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetch = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/api/account/${accountId}`);
      setAccount(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load account', 'error');
    } finally {
      setLoading(false);
    }
  }, [accountId, showToast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { account, loading, error, refetch: fetch };
}
