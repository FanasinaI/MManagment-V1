import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/id';
import type { NewSavingsPocket, SavingsPocket } from '@/validation/savingsSchema';

import type { DbConnection } from '../types';

export function createSavingsRepository(db: DbConnection) {
  return {
    async list(): Promise<SavingsPocket[]> {
      return db.getAllAsync<SavingsPocket>('SELECT * FROM savings;');
    },

    async create(input: NewSavingsPocket): Promise<SavingsPocket> {
      const id = generateId();
      await db.runAsync('INSERT INTO savings (id, name, targetAmount, balance) VALUES (?, ?, ?, 0);', [
        id,
        input.name,
        input.targetAmount ?? null,
      ]);
      return { id, name: input.name, targetAmount: input.targetAmount ?? null, balance: 0 };
    },

    /** Positive amount = versement, negative = retrait de la poche d'épargne. */
    async adjustBalance(id: string, delta: number): Promise<void> {
      await db.runAsync('UPDATE savings SET balance = balance + ? WHERE id = ?;', [delta, id]);
    },

    /**
     * Moves money out of a real account and into the pocket atomically — a
     * deposit has to come from somewhere — and logs it as a transaction so
     * it's visible in the transactions list/history, not just as a silent
     * balance change. Logged as type "transfer" (excluded from cashflow /
     * expense stats, like an account-to-account transfer) with a negative
     * amount so it displays as an outflow from that account; `toAccountId`
     * stays null since a savings pocket isn't a row in `accounts`.
     */
    async depositFromAccount(pocketId: string, accountId: string, amount: number, pocketName: string): Promise<void> {
      const now = nowIso();
      await db.withTransactionAsync(async () => {
        await db.runAsync('UPDATE savings SET balance = balance + ? WHERE id = ?;', [amount, pocketId]);
        await db.runAsync('UPDATE accounts SET balance = balance - ?, updatedAt = ? WHERE id = ?;', [amount, now, accountId]);
        await db.runAsync(
          `INSERT INTO transactions (id, accountId, toAccountId, type, amount, categoryId, source, status, occurredAt, hash, note)
           VALUES (?, ?, NULL, 'transfer', ?, NULL, 'manual', 'confirmed', ?, NULL, ?);`,
          [generateId(), accountId, -amount, now, `Versement vers l'épargne « ${pocketName} »`]
        );
      });
    },

    /**
     * The reverse of depositFromAccount: moves money out of the pocket and
     * back into a real account, logged the same way. Re-checks the balance
     * inside the transaction (not just the UI) so a stale in-memory pocket
     * balance can never push a pocket negative — a savings pocket has no
     * concept of overdraft.
     */
    async withdrawToAccount(pocketId: string, accountId: string, amount: number, pocketName: string): Promise<void> {
      const now = nowIso();
      await db.withTransactionAsync(async () => {
        const row = await db.getFirstAsync<{ balance: number }>('SELECT balance FROM savings WHERE id = ?;', [pocketId]);
        if (!row || amount > row.balance) {
          throw new Error("Le montant dépasse le solde de la poche d'épargne.");
        }
        await db.runAsync('UPDATE savings SET balance = balance - ? WHERE id = ?;', [amount, pocketId]);
        await db.runAsync('UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?;', [amount, now, accountId]);
        await db.runAsync(
          `INSERT INTO transactions (id, accountId, toAccountId, type, amount, categoryId, source, status, occurredAt, hash, note)
           VALUES (?, ?, NULL, 'transfer', ?, NULL, 'manual', 'confirmed', ?, NULL, ?);`,
          [generateId(), accountId, amount, now, `Retrait depuis l'épargne « ${pocketName} »`]
        );
      });
    },

    async update(id: string, patch: { name: string; targetAmount: number | null }): Promise<void> {
      await db.runAsync('UPDATE savings SET name = ?, targetAmount = ? WHERE id = ?;', [patch.name, patch.targetAmount, id]);
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM savings WHERE id = ?;', [id]);
    },
  };
}

export type SavingsRepository = ReturnType<typeof createSavingsRepository>;
