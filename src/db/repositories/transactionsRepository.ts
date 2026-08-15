import { signedAmount } from '@/domain/finance/balances';
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/id';
import type { NewManualTransaction, Transaction } from '@/validation/transactionSchema';

import type { DbConnection } from '../types';

interface TransactionRow {
  id: string;
  accountId: string;
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

    /** Manual entry (CDC §9): confirmed immediately, balance updated atomically. */
    async createManual(input: NewManualTransaction): Promise<Transaction> {
      const id = generateId();
      const record: Transaction = {
        id,
        accountId: input.accountId,
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
          `INSERT INTO transactions (id, accountId, type, amount, categoryId, source, status, occurredAt, hash, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            record.id,
            record.accountId,
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
        await db.runAsync('UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?;', [
          signedAmount(record),
          nowIso(),
          record.accountId,
        ]);
      });

      return record;
    },

    /** SMS-detected draft (CDC §8): created as PENDING, no balance impact until confirmed. */
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
        `INSERT INTO transactions (id, accountId, type, amount, categoryId, source, status, occurredAt, hash, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          record.id,
          record.accountId,
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
        await db.runAsync('UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?;', [
          signedAmount({ type: row.type, amount: row.amount }),
          nowIso(),
          accountId,
        ]);
      });
    },

    async reject(id: string): Promise<void> {
      await db.runAsync('UPDATE transactions SET status = ?, updatedAt = ? WHERE id = ?;', ['rejected', nowIso(), id]);
    },

    /** Reverses the balance impact first if the transaction was confirmed, then deletes it. */
    async remove(id: string): Promise<void> {
      await db.withTransactionAsync(async () => {
        const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?;', [id]);
        if (!row) return;

        if (row.status === 'confirmed') {
          await db.runAsync('UPDATE accounts SET balance = balance - ?, updatedAt = ? WHERE id = ?;', [
            signedAmount({ type: row.type, amount: row.amount }),
            nowIso(),
            row.accountId,
          ]);
        }
        await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
      });
    },
  };
}

export type TransactionsRepository = ReturnType<typeof createTransactionsRepository>;
