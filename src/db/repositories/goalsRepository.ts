import { nowIso } from '@/utils/date';
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

    /** Moves money out of a real account and into the goal atomically — same "where does it come from" fix as savings pockets. */
    async contributeFromAccount(id: string, accountId: string, amount: number): Promise<void> {
      await db.withTransactionAsync(async () => {
        await db.runAsync('UPDATE goals SET currentAmount = currentAmount + ? WHERE id = ?;', [amount, id]);
        await db.runAsync('UPDATE accounts SET balance = balance - ?, updatedAt = ? WHERE id = ?;', [amount, nowIso(), accountId]);
      });
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM goals WHERE id = ?;', [id]);
    },
  };
}

export type GoalsRepository = ReturnType<typeof createGoalsRepository>;
