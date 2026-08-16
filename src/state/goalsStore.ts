import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { alertsService } from '@/services/alerts/alertsService';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';
import type { Goal, NewGoal } from '@/validation/goalSchema';

import { useAccountsStore } from './accountsStore';
import { useTransactionsStore } from './transactionsStore';

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  load: () => Promise<void>;
  addGoal: (input: NewGoal) => Promise<Goal>;
  /** Moves `amount` out of `accountId` and into the goal — a contribution always has a real source. */
  contribute: (id: string, amount: number, accountId: string) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { goals } = await getRepositories();
    const list = await goals.list();
    set({ goals: list, loading: false });
  },

  async addGoal(input) {
    const { goals } = await getRepositories();
    const created = await goals.create(input);
    set({ goals: [...get().goals, created] });
    void notificationService.sendImmediate(notificationTemplates.goalAdded(created.name));
    return created;
  },

  async contribute(id, amount, accountId) {
    const goal = get().goals.find((g) => g.id === id);
    const { goals } = await getRepositories();
    await goals.contributeFromAccount(id, accountId, amount, goal?.name ?? 'Objectif');
    set({ goals: get().goals.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g)) });
    await Promise.all([useAccountsStore.getState().load(), useTransactionsStore.getState().load()]);
    void alertsService.evaluateAndNotify();
  },
}));
