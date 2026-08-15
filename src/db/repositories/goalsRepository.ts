import { generateId } from '@/utils/id';
import type { Goal, NewGoal } from '@/validation/goalSchema';

import type { DbConnection } from '../types';

export function createGoalsRepository(db: DbConnection) {
  return {
    async list(): Promise<Goal[]> {
      return db.getAllAsync<Goal>('SELECT * FROM goals;');
    },

    async create(input: NewGoal): Promise<Goal> {
      const id = generateId();
      await db.runAsync('INSERT INTO goals (id, name, targetAmount, currentAmount, targetDate) VALUES (?, ?, ?, 0, ?);', [
        id,
        input.name,
        input.targetAmount,
        input.targetDate ?? null,
      ]);
      return { id, name: input.name, targetAmount: input.targetAmount, currentAmount: 0, targetDate: input.targetDate ?? null };
    },

    async contribute(id: string, amount: number): Promise<void> {
      await db.runAsync('UPDATE goals SET currentAmount = currentAmount + ? WHERE id = ?;', [amount, id]);
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM goals WHERE id = ?;', [id]);
    },
  };
}

export type GoalsRepository = ReturnType<typeof createGoalsRepository>;
