import { create } from 'zustand';

import { signedAmount } from '@/domain/finance/balances';
import { getRepositories } from '@/db/repositories';
import { alertsService } from '@/services/alerts/alertsService';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';
import { formatSignedMoney } from '@/utils/money';
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
  confirmAllPending: () => Promise<void>;
  rejectPending: (id: string) => Promise<void>;
  update: (
    id: string,
    patch: {
      accountId: string;
      toAccountId?: string | null;
      type: Transaction['type'];
      amount: number;
      categoryId?: string | null;
      occurredAt: string;
      note?: string | null;
    }
  ) => Promise<void>;
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
    void notificationService.sendImmediate(notificationTemplates.transactionAdded(formatSignedMoney(signedAmount(created))));
    void alertsService.evaluateAndNotify();
    return created;
  },

  async confirmPending(id, corrections) {
    const confirmedTx = get().pending.find((tx) => tx.id === id);
    const { transactions } = await getRepositories();
    await transactions.confirm(id, corrections);
    set({ pending: get().pending.filter((tx) => tx.id !== id) });
    await Promise.all([get().load(), useAccountsStore.getState().load()]);
    if (confirmedTx) {
      void notificationService.sendImmediate(notificationTemplates.transactionConfirmed(formatSignedMoney(signedAmount(confirmedTx))));
    }
    void alertsService.evaluateAndNotify();
  },

  /** Confirms every pending transaction as-is (no per-item corrections), with a single summary notification instead of one per item. */
  async confirmAllPending() {
    const { transactions } = await getRepositories();
    const ids = get().pending.map((tx) => tx.id);
    for (const id of ids) {
      await transactions.confirm(id);
    }
    set({ pending: [] });
    await Promise.all([get().load(), useAccountsStore.getState().load()]);
    if (ids.length > 0) {
      void notificationService.sendImmediate(notificationTemplates.transactionsBulkConfirmed(ids.length));
    }
    void alertsService.evaluateAndNotify();
  },

  async rejectPending(id) {
    const { transactions } = await getRepositories();
    await transactions.reject(id);
    set({ pending: get().pending.filter((tx) => tx.id !== id) });
  },

  async update(id, patch) {
    const { transactions } = await getRepositories();
    await transactions.update(id, patch);
    await Promise.all([get().load(), useAccountsStore.getState().load()]);
    void alertsService.evaluateAndNotify();
  },

  async remove(id) {
    const { transactions } = await getRepositories();
    await transactions.remove(id);
    set({ transactions: get().transactions.filter((tx) => tx.id !== id) });
    await useAccountsStore.getState().load();
  },
}));
