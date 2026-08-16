import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';
import type { NewSavingsPocket, SavingsPocket } from '@/validation/savingsSchema';

interface SavingsState {
  pockets: SavingsPocket[];
  loading: boolean;
  load: () => Promise<void>;
  addPocket: (input: NewSavingsPocket) => Promise<SavingsPocket>;
  deposit: (id: string, amount: number) => Promise<void>;
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

  async deposit(id, amount) {
    const { savings } = await getRepositories();
    await savings.adjustBalance(id, amount);
    set({ pockets: get().pockets.map((p) => (p.id === id ? { ...p, balance: p.balance + amount } : p)) });
  },
}));
