import type { Migration } from '../migrationRunner';

/**
 * Recurring transaction rules (rent, salary, subscriptions) not covered by
 * CDC §11's fixed schema. `nextOccurrence` is the next due date; processing
 * (src/services/recurring) generates a normal `transactions` row for each
 * due occurrence and advances it, so recurring rules never touch balances
 * directly — they only ever produce rows through the same manual-transaction
 * path as everything else.
 */
export const migration007AddRecurringTransactions: Migration = {
  version: 7,
  name: 'add_recurring_transactions',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        toAccountId TEXT REFERENCES accounts(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        categoryId TEXT REFERENCES categories(id) ON DELETE SET NULL,
        note TEXT,
        frequency TEXT NOT NULL,
        nextOccurrence TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(active);
    `);
  },
};
