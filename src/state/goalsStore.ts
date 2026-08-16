import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { alertsService } from '@/services/alerts/alertsService';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';
import type { Goal, NewGoal } from '@/validation/goalSchema';

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  load: () => Promise<void>;
  addGoal: (input: NewGoal) => Promise<Goal>;
  contribute: (id: string, amount: number) => Promise<void>;
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

  async contribute(id, amount) {
    const { goals } = await getRepositories();
    await goals.contribute(id, amount);
    set({ goals: get().goals.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g)) });
    void alertsService.evaluateAndNotify();
  },
}));
