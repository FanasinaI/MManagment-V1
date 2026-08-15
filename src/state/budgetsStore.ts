import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import type { Budget, NewBudget } from '@/validation/budgetSchema';

interface BudgetsState {
  budgets: Budget[];
  loading: boolean;
  load: () => Promise<void>;
  addBudget: (input: NewBudget) => Promise<Budget>;
  removeBudget: (id: string) => Promise<void>;
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { budgets } = await getRepositories();
    const list = await budgets.list();
    set({ budgets: list, loading: false });
  },

  async addBudget(input) {
    const { budgets } = await getRepositories();
    const created = await budgets.create(input);
    set({ budgets: [...get().budgets, created] });
    return created;
  },

  async removeBudget(id) {
    const { budgets } = await getRepositories();
    await budgets.remove(id);
    set({ budgets: get().budgets.filter((b) => b.id !== id) });
  },
}));
