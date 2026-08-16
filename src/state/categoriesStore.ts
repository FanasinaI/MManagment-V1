import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import type { Category } from '@/validation/backupSchema';

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  load: () => Promise<void>;
  addCategory: (input: { name: string; icon?: string | null }) => Promise<Category>;
  updateCategory: (id: string, patch: { name: string; icon: string | null }) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { categories } = await getRepositories();
    const list = await categories.list();
    set({ categories: list, loading: false });
  },

  async addCategory(input) {
    const { categories } = await getRepositories();
    const created = await categories.create(input);
    set({ categories: [...get().categories, created] });
    return created;
  },

  async updateCategory(id, patch) {
    const { categories } = await getRepositories();
    await categories.update(id, patch);
    set({ categories: get().categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },

  async removeCategory(id) {
    const { categories } = await getRepositories();
    await categories.remove(id);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },
}));
