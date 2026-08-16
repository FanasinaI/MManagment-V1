import type { BackupPayload } from '@/validation/backupSchema';

import type { DbConnection } from './types';

// Children before parents, so FK constraints never trip during the wipe.
const TABLES_CHILD_TO_PARENT = [
  'transactions',
  'budgets',
  'sms_events',
  'sms_sources',
  'alerts',
  'savings',
  'goals',
  'categories',
  'accounts',
] as const;

/**
 * Replaces all local data with the contents of an already-validated backup
 * payload (CDC §16). This is a destructive replace, not a merge: the CDC
 * doesn't specify a conflict policy for existing local data, and replace is
 * the least surprising behavior for a personal, single-user restore ("go
 * back to this backup"). Original row ids are preserved so foreign keys
 * (transactions.accountId, budgets.categoryId, ...) stay intact. Runs as one
 * transaction — either the whole restore lands, or none of it does.
 */
export async function restoreDatabase(db: DbConnection, payload: BackupPayload): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const table of TABLES_CHILD_TO_PARENT) {
      await db.execAsync(`DELETE FROM ${table};`);
    }

    for (const account of payload.accounts) {
      await db.runAsync(
        `INSERT INTO accounts (id, name, provider, type, currency, balance, sortOrder, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          account.id,
          account.name,
          account.provider,
          account.type,
          account.currency,
          account.balance,
          account.sortOrder,
          account.isDefault ? 1 : 0,
        ]
      );
    }

    for (const category of payload.categories) {
      await db.runAsync('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?);', [
        category.id,
        category.name,
        category.icon,
      ]);
    }

    for (const pocket of payload.savings) {
      await db.runAsync('INSERT INTO savings (id, name, targetAmount, balance) VALUES (?, ?, ?, ?);', [
        pocket.id,
        pocket.name,
        pocket.targetAmount,
        pocket.balance,
      ]);
    }

    for (const goal of payload.goals) {
      await db.runAsync('INSERT INTO goals (id, name, targetAmount, currentAmount, targetDate) VALUES (?, ?, ?, ?, ?);', [
        goal.id,
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        goal.targetDate,
      ]);
    }

    for (const source of payload.smsSources) {
      await db.runAsync(
        'INSERT INTO sms_sources (id, name, senderPattern, enabled, parserVersion, provider, autoConfirm, accountId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
        [
          source.id,
          source.name,
          source.senderPattern,
          source.enabled ? 1 : 0,
          source.parserVersion,
          source.provider,
          source.autoConfirm ? 1 : 0,
          source.accountId,
        ]
      );
    }

    for (const alert of payload.alerts) {
      await db.runAsync('INSERT INTO alerts (id, type, threshold, enabled) VALUES (?, ?, ?, ?);', [
        alert.id,
        alert.type,
        alert.threshold,
        alert.enabled ? 1 : 0,
      ]);
    }

    for (const budget of payload.budgets) {
      await db.runAsync('INSERT INTO budgets (id, categoryId, amount, period, threshold) VALUES (?, ?, ?, ?, ?);', [
        budget.id,
        budget.categoryId,
        budget.amount,
        budget.period,
        budget.threshold,
      ]);
    }

    for (const tx of payload.transactions) {
      await db.runAsync(
        `INSERT INTO transactions (id, accountId, toAccountId, type, amount, categoryId, source, status, occurredAt, hash, note, reportedBalance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          tx.id,
          tx.accountId,
          tx.toAccountId,
          tx.type,
          tx.amount,
          tx.categoryId,
          tx.source,
          tx.status,
          tx.occurredAt,
          tx.hash,
          tx.note,
          tx.reportedBalance,
        ]
      );
    }
  });
}
