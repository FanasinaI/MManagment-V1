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

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM budgets WHERE id = ?;', [id]);
    },
  };
}

export type BudgetsRepository = ReturnType<typeof createBudgetsRepository>;
