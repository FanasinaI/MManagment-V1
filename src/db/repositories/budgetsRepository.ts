import { generateId } from '@/utils/id';
import type { Budget, NewBudget } from '@/validation/budgetSchema';

import type { DbConnection } from '../types';

export function createBudgetsRepository(db: DbConnection) {
  return {
    async list(): Promise<Budget[]> {
      return db.getAllAsync<Budget>('SELECT * FROM budgets;');
    },

    async create(input: NewBudget): Promise<Budget> {
      const id = generateId();
      await db.runAsync('INSERT INTO budgets (id, categoryId, amount, period, threshold) VALUES (?, ?, ?, ?, ?);', [
        id,
        input.categoryId,
        input.amount,
        input.period,
        input.threshold,
      ]);
      return { id, ...input };
    },

    async update(id: string, patch: { categoryId: string; amount: number; period: Budget['period']; threshold: number }): Promise<void> {
      await db.runAsync('UPDATE budgets SET categoryId = ?, amount = ?, period = ?, threshold = ? WHERE id = ?;', [
        patch.categoryId,
        patch.amount,
        patch.period,
        patch.threshold,
        id,
      ]);
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM budgets WHERE id = ?;', [id]);
    },
  };
}

export type BudgetsRepository = ReturnType<typeof createBudgetsRepository>;
