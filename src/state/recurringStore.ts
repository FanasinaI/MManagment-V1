import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { recurringTransactionsService } from '@/services/recurring/recurringTransactionsService';
import type { NewRecurringTransaction, RecurringTransaction } from '@/validation/recurringTransactionSchema';

import { useAccountsStore } from './accountsStore';
import { useTransactionsStore } from './transactionsStore';

interface RecurringUpdatePatch {
  accountId: string;
  toAccountId?: string | null;
  type: RecurringTransaction['type'];
  amount: number;
  categoryId?: string | null;
  note?: string | null;
  frequency: RecurringTransaction['frequency'];
  nextOccurrence: string;
}

interface RecurringState {
  rules: RecurringTransaction[];
  loading: boolean;
  load: () => Promise<void>;
  addRule: (input: NewRecurringTransaction) => Promise<RecurringTransaction>;
  updateRule: (id: string, patch: RecurringUpdatePatch) => Promise<void>;
  setActive: (id: string, active: boolean) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  /** Generates any due occurrences (run on app boot), then reloads rules/transactions/accounts if anything was generated. */
  processDue: () => Promise<number>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  rules: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { recurringTransactions } = await getRepositories();
    const list = await recurringTransactions.list();
    set({ rules: list, loading: false });
  },

  async addRule(input) {
    const { recurringTransactions } = await getRepositories();
    const created = await recurringTransactions.create(input);
    set({ rules: [...get().rules, created] });
    return created;
  },

  async updateRule(id, patch) {
    const { recurringTransactions } = await getRepositories();
    await recurringTransactions.update(id, patch);
    set({ rules: get().rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  },

  async setActive(id, active) {
    const { recurringTransactions } = await getRepositories();
    await recurringTransactions.setActive(id, active);
    set({ rules: get().rules.map((r) => (r.id === id ? { ...r, active } : r)) });
  },

  async removeRule(id) {
    const { recurringTransactions } = await getRepositories();
    await recurringTransactions.remove(id);
    set({ rules: get().rules.filter((r) => r.id !== id) });
  },

  async processDue() {
    const generated = await recurringTransactionsService.processDue();
    if (generated > 0) {
      await Promise.all([get().load(), useTransactionsStore.getState().load(), useAccountsStore.getState().load()]);
    }
    return generated;
  },
}));
