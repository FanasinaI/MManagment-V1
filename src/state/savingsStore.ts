import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';
import type { NewSavingsPocket, SavingsPocket } from '@/validation/savingsSchema';

import { useAccountsStore } from './accountsStore';
import { useTransactionsStore } from './transactionsStore';

interface SavingsState {
  pockets: SavingsPocket[];
  loading: boolean;
  load: () => Promise<void>;
  addPocket: (input: NewSavingsPocket) => Promise<SavingsPocket>;
  /** Moves `amount` out of `accountId` and into the pocket — a deposit always has a real source. */
  deposit: (id: string, amount: number, accountId: string) => Promise<void>;
  /** Moves `amount` out of the pocket and back into `accountId`. */
  withdraw: (id: string, amount: number, accountId: string) => Promise<void>;
  updatePocket: (id: string, patch: { name: string; targetAmount: number | null }) => Promise<void>;
  removePocket: (id: string) => Promise<void>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  pockets: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { savings } = await getRepositories();
    const list = await savings.list();
    set({ pockets: list, loading: false });
  },

  async addPocket(input) {
    const { savings } = await getRepositories();
    const created = await savings.create(input);
    set({ pockets: [...get().pockets, created] });
    void notificationService.sendImmediate(notificationTemplates.savingsPocketAdded(created.name));
    return created;
  },

  async deposit(id, amount, accountId) {
    const pocket = get().pockets.find((p) => p.id === id);
    const { savings } = await getRepositories();
    await savings.depositFromAccount(id, accountId, amount, pocket?.name ?? 'Épargne');
    set({ pockets: get().pockets.map((p) => (p.id === id ? { ...p, balance: p.balance + amount } : p)) });
    await Promise.all([useAccountsStore.getState().load(), useTransactionsStore.getState().load()]);
  },

  async withdraw(id, amount, accountId) {
    const pocket = get().pockets.find((p) => p.id === id);
    const { savings } = await getRepositories();
    await savings.withdrawToAccount(id, accountId, amount, pocket?.name ?? 'Épargne');
    set({ pockets: get().pockets.map((p) => (p.id === id ? { ...p, balance: p.balance - amount } : p)) });
    await Promise.all([useAccountsStore.getState().load(), useTransactionsStore.getState().load()]);
  },

  async updatePocket(id, patch) {
    const { savings } = await getRepositories();
    await savings.update(id, patch);
    set({ pockets: get().pockets.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },

  async removePocket(id) {
    const { savings } = await getRepositories();
    await savings.remove(id);
    set({ pockets: get().pockets.filter((p) => p.id !== id) });
  },
}));
