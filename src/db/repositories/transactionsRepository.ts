import { computeBalanceEffects } from '@/domain/finance/balances';
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/id';
import type { NewManualTransaction, Transaction } from '@/validation/transactionSchema';

import type { DbConnection } from '../types';

interface TransactionRow {
  id: string;
  accountId: string;
  toAccountId: string | null;
  type: string;
  amount: number;
  categoryId: string | null;
  source: string;
  status: string;
  occurredAt: string;
  hash: string | null;
  note: string | null;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.accountId,
    toAccountId: row.toAccountId,
    type: row.type as Transaction['type'],
    amount: row.amount,
    categoryId: row.categoryId,
    source: row.source as Transaction['source'],
    status: row.status as Transaction['status'],
    occurredAt: row.occurredAt,
    hash: row.hash,
    note: row.note,
  };
}

/** Applies a transaction's balance effect (both legs for a transfer) via the pure computeBalanceEffects. */
async function applyBalanceEffect(
  db: DbConnection,
  record: Pick<Transaction, 'type' | 'amount' | 'accountId' | 'toAccountId'>,
  sign: 1 | -1
): Promise<void> {
  const now = nowIso();
  for (const effect of computeBalanceEffects(record, sign)) {
    await db.runAsync('UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?;', [effect.delta, now, effect.accountId]);
  }
}

export function createTransactionsRepository(db: DbConnection) {
  return {
    async list(): Promise<Transaction[]> {
      const rows = await db.getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY occurredAt DESC;');
      return rows.map(toTransaction);
    },

    async listByStatus(status: Transaction['status']): Promise<Transaction[]> {
      const rows = await db.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE status = ? ORDER BY occurredAt DESC;',
        [status]
      );
      return rows.map(toTransaction);
    },

    async findByHash(hash: string): Promise<Transaction | null> {
      const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE hash = ?;', [hash]);
      return row ? toTransaction(row) : null;
    },

    /** Manual entry (CDC §9): confirmed immediately, balance updated atomically (both legs for a transfer). */
    async createManual(input: NewManualTransaction): Promise<Transaction> {
      const id = generateId();
      const record: Transaction = {
        id,
        accountId: input.accountId,
        toAccountId: input.toAccountId ?? null,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        source: 'manual',
        status: 'confirmed',
        occurredAt: input.occurredAt,
        hash: null,
        note: input.note ?? null,
      };

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO transactions (id, accountId, toAccountId, type, amount, categoryId, source, status, occurredAt, hash, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            record.id,
            record.accountId,
            record.toAccountId,
            record.type,
            record.amount,
            record.categoryId,
            record.source,
            record.status,
            record.occurredAt,
            record.hash,
            record.note,
          ]
        );
        await applyBalanceEffect(db, record, 1);
      });

      return record;
    },

    /** SMS-detected draft (CDC §8): created as PENDING, no balance impact until confirmed. Never a transfer — parsers don't produce that type. */
    async createPendingFromSms(input: {
      accountId: string;
      type: Transaction['type'];
      amount: number;
      categoryId?: string | null;
      occurredAt: string;
      hash: string;
    }): Promise<Transaction> {
      const id = generateId();
      const record: Transaction = {
        id,
        accountId: input.accountId,
        toAccountId: null,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        source: 'sms',
        status: 'pending',
        occurredAt: input.occurredAt,
        hash: input.hash,
        note: null,
      };
      await db.runAsync(
        `INSERT INTO transactions (id, accountId, toAccountId, type, amount, categoryId, source, status, occurredAt, hash, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          record.id,
          record.accountId,
          record.toAccountId,
          record.type,
          record.amount,
          record.categoryId,
          record.source,
          record.status,
          record.occurredAt,
          record.hash,
          record.note,
        ]
      );
      return record;
    },

    /** CDC §8: user confirms a PENDING transaction, optionally correcting category/account; applies the balance change. */
    async confirm(id: string, corrections?: { accountId?: string; categoryId?: string | null }): Promise<void> {
      await db.withTransactionAsync(async () => {
        const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?;', [id]);
        if (!row || row.status !== 'pending') return;

        const accountId = corrections?.accountId ?? row.accountId;
        const categoryId = corrections?.categoryId !== undefined ? corrections.categoryId : row.categoryId;

        await db.runAsync(
          'UPDATE transactions SET status = ?, accountId = ?, categoryId = ?, updatedAt = ? WHERE id = ?;',
          ['confirmed', accountId, categoryId, nowIso(), id]
        );
        await applyBalanceEffect(db, { type: row.type as Transaction['type'], amount: row.amount, accountId, toAccountId: row.toAccountId }, 1);
      });
    },

    async reject(id: string): Promise<void> {
      await db.runAsync('UPDATE transactions SET status = ?, updatedAt = ? WHERE id = ?;', ['rejected', nowIso(), id]);
    },

    /** Reverses the balance impact first if the transaction was confirmed (both legs for a transfer), then deletes it. */
    async remove(id: string): Promise<void> {
      await db.withTransactionAsync(async () => {
        const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?;', [id]);
        if (!row) return;

        if (row.status === 'confirmed') {
          await applyBalanceEffect(
            db,
            { type: row.type as Transaction['type'], amount: row.amount, accountId: row.accountId, toAccountId: row.toAccountId },
            -1
          );
        }
        await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
      });
    },
  };
}

export type TransactionsRepository = ReturnType<typeof createTransactionsRepository>;
