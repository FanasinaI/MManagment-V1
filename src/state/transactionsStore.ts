import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import type { NewManualTransaction, Transaction } from '@/validation/transactionSchema';

import { useAccountsStore } from './accountsStore';

interface TransactionsState {
  transactions: Transaction[];
  pending: Transaction[];
  loading: boolean;
  load: () => Promise<void>;
  loadPending: () => Promise<void>;
  addManual: (input: NewManualTransaction) => Promise<Transaction>;
  confirmPending: (id: string, corrections?: { accountId?: string; categoryId?: string | null }) => Promise<void>;
  rejectPending: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  pending: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { transactions } = await getRepositories();
    const list = await transactions.list();
    set({ transactions: list, loading: false });
  },

  async loadPending() {
    const { transactions } = await getRepositories();
    const list = await transactions.listByStatus('pending');
    set({ pending: list });
  },

  async addManual(input) {
    const { transactions } = await getRepositories();
    const created = await transactions.createManual(input);
    set({ transactions: [created, ...get().transactions] });
    await useAccountsStore.getState().load();
    return created;
  },

  async confirmPending(id, corrections) {
    const { transactions } = await getRepositories();
    await transactions.confirm(id, corrections);
    set({ pending: get().pending.filter((tx) => tx.id !== id) });
    await Promise.all([get().load(), useAccountsStore.getState().load()]);
  },

  async rejectPending(id) {
    const { transactions } = await getRepositories();
    await transactions.reject(id);
    set({ pending: get().pending.filter((tx) => tx.id !== id) });
  },

  async remove(id) {
    const { transactions } = await getRepositories();
    await transactions.remove(id);
    set({ transactions: get().transactions.filter((tx) => tx.id !== id) });
    await useAccountsStore.getState().load();
  },
}));
