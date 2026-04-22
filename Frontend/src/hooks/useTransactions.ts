import { useState, useCallback, useEffect } from "react";
import { apiRequest } from "../api/axios";
import type { Account, Category, Transaction } from "../types/transactions";
import { unwrapArray, applyStoredIcons } from "../utils/transactionUtils";

export function useTransactions(
  userId: string | undefined,
  token: string | null | undefined
) {
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      // Accounts
      const accRaw = await apiRequest<any>(`/api/accounts/user/${userId}`, { token });
      const accs = unwrapArray<Account>(accRaw);
      setAccounts(accs);

      // Categories
      const catRaw = await apiRequest<any>(`/api/categories/${userId}`, { token });
      const cats = applyStoredIcons(unwrapArray<Category>(catRaw));
      setCategories(cats);

      // Transactions — one request per account, merged and sorted
      const txArrays = await Promise.all(
        accs.map(async (acc) => {
          try {
            const raw = await apiRequest<any>(
              `/api/transactions/account/${acc.account_id}`, { token }
            );
            return unwrapArray<Transaction>(raw);
          } catch {
            return [];
          }
        })
      );
      setTransactions(
        txArrays
          .flat()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  // Lightweight re-fetch — only categories, used after the category modal changes
  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    try {
      const catRaw = await apiRequest<any>(`/api/categories/${userId}`, { token });
      setCategories(applyStoredIcons(unwrapArray<Category>(catRaw)));
    } catch { /* silently ignore */ }
  }, [userId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    accounts,
    categories,
    transactions,
    loading,
    error,
    setError,
    fetchAll,
    fetchCategories,
  };
}
