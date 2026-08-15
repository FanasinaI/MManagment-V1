import { generateId } from '@/utils/id';
import type { Category } from '@/validation/backupSchema';

import type { DbConnection } from '../types';

export function createCategoriesRepository(db: DbConnection) {
  return {
    async list(): Promise<Category[]> {
      return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC;');
    },

    async create(input: { name: string; icon?: string | null }): Promise<Category> {
      const id = generateId();
      await db.runAsync('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?);', [id, input.name, input.icon ?? null]);
      return { id, name: input.name, icon: input.icon ?? null };
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
    },
  };
}

export type CategoriesRepository = ReturnType<typeof createCategoriesRepository>;
