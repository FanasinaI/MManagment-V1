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

    /**
     * Moves money out of a real account and into the goal atomically, and
     * logs it as a transaction (same reasoning as savingsRepository's
     * depositFromAccount) so it shows up in the transactions history.
     */
    async contributeFromAccount(id: string, accountId: string, amount: number, goalName: string): Promise<void> {
      const now = nowIso();
      await db.withTransactionAsync(async () => {
        await db.runAsync('UPDATE goals SET currentAmount = currentAmount + ? WHERE id = ?;', [amount, id]);
        await db.runAsync('UPDATE accounts SET balance = balance - ?, updatedAt = ? WHERE id = ?;', [amount, now, accountId]);
        await db.runAsync(
          `INSERT INTO transactions (id, accountId, toAccountId, type, amount, categoryId, source, status, occurredAt, hash, note)
           VALUES (?, ?, NULL, 'transfer', ?, NULL, 'manual', 'confirmed', ?, NULL, ?);`,
          [generateId(), accountId, -amount, now, `Contribution à l'objectif « ${goalName} »`]
        );
      });
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM goals WHERE id = ?;', [id]);
    },
  };
}

export type GoalsRepository = ReturnType<typeof createGoalsRepository>;
