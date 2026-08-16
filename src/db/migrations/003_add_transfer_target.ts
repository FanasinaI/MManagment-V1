import type { Migration } from '../migrationRunner';

/**
 * A "transfer" transaction needs a destination account to move money
 * between two of the user's own accounts atomically — the CDC §11 schema
 * doesn't have this column, and the app previously only ever touched the
 * source account's balance for transfers (a real bug).
 */
export const migration003AddTransferTarget: Migration = {
  version: 3,
  name: 'add_transfer_target',
  up: async (db) => {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN toAccountId TEXT REFERENCES accounts(id) ON DELETE SET NULL;
    `);
  },
};
