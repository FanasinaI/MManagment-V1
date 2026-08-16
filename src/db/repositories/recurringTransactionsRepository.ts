import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/id';
import type { NewRecurringTransaction, RecurringTransaction } from '@/validation/recurringTransactionSchema';

import type { DbConnection } from '../types';

interface RecurringTransactionRow {
  id: string;
  accountId: string;
  toAccountId: string | null;
  type: string;
  amount: number;
  categoryId: string | null;
  note: string | null;
  frequency: string;
  nextOccurrence: string;
  active: number;
}

function toRecurring(row: RecurringTransactionRow): RecurringTransaction {
  return {
    id: row.id,
    accountId: row.accountId,
    toAccountId: row.toAccountId,
    type: row.type as RecurringTransaction['type'],
    amount: row.amount,
    categoryId: row.categoryId,
    note: row.note,
    frequency: row.frequency as RecurringTransaction['frequency'],
    nextOccurrence: row.nextOccurrence,
    active: row.active === 1,
  };
}

export function createRecurringTransactionsRepository(db: DbConnection) {
  return {
    async list(): Promise<RecurringTransaction[]> {
      const rows = await db.getAllAsync<RecurringTransactionRow>('SELECT * FROM recurring_transactions ORDER BY nextOccurrence ASC;');
      return rows.map(toRecurring);
    },

    async listActive(): Promise<RecurringTransaction[]> {
      const rows = await db.getAllAsync<RecurringTransactionRow>('SELECT * FROM recurring_transactions WHERE active = 1;');
      return rows.map(toRecurring);
    },

    async create(input: NewRecurringTransaction): Promise<RecurringTransaction> {
      const id = generateId();
      const now = nowIso();
      await db.runAsync(
        `INSERT INTO recurring_transactions (id, accountId, toAccountId, type, amount, categoryId, note, frequency, nextOccurrence, active, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);`,
        [
          id,
          input.accountId,
          input.toAccountId ?? null,
          input.type,
          input.amount,
          input.categoryId ?? null,
          input.note ?? null,
          input.frequency,
          input.nextOccurrence,
          now,
          now,
        ]
      );
      return {
        id,
        accountId: input.accountId,
        toAccountId: input.toAccountId ?? null,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        note: input.note ?? null,
        frequency: input.frequency,
        nextOccurrence: input.nextOccurrence,
        active: true,
      };
    },

    async update(
      id: string,
      patch: {
        accountId: string;
        toAccountId?: string | null;
        type: RecurringTransaction['type'];
        amount: number;
        categoryId?: string | null;
        note?: string | null;
        frequency: RecurringTransaction['frequency'];
        nextOccurrence: string;
      }
    ): Promise<void> {
      await db.runAsync(
        `UPDATE recurring_transactions
         SET accountId = ?, toAccountId = ?, type = ?, amount = ?, categoryId = ?, note = ?, frequency = ?, nextOccurrence = ?, updatedAt = ?
         WHERE id = ?;`,
        [
          patch.accountId,
          patch.toAccountId ?? null,
          patch.type,
          patch.amount,
          patch.categoryId ?? null,
          patch.note ?? null,
          patch.frequency,
          patch.nextOccurrence,
          nowIso(),
          id,
        ]
      );
    },

    async setActive(id: string, active: boolean): Promise<void> {
      await db.runAsync('UPDATE recurring_transactions SET active = ?, updatedAt = ? WHERE id = ?;', [active ? 1 : 0, nowIso(), id]);
    },

    /** Advances a rule past however many occurrences processDue() just generated for it. */
    async advance(id: string, nextOccurrence: string): Promise<void> {
      await db.runAsync('UPDATE recurring_transactions SET nextOccurrence = ?, updatedAt = ? WHERE id = ?;', [nextOccurrence, nowIso(), id]);
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?;', [id]);
    },
  };
}

export type RecurringTransactionsRepository = ReturnType<typeof createRecurringTransactionsRepository>;
