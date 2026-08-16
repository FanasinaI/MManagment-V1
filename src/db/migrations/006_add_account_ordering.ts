import type { Migration } from '../migrationRunner';

/**
 * Lets the user pick one account as the default (pre-selected when creating
 * a transaction) and control display order in the accounts list. New rows
 * default to sortOrder 0 like everyone else; ties break by createdAt so
 * existing accounts keep their original relative order until reordered.
 */
export const migration006AddAccountOrdering: Migration = {
  version: 6,
  name: 'add_account_ordering',
  up: async (db) => {
    await db.execAsync(`
      ALTER TABLE accounts ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE accounts ADD COLUMN isDefault INTEGER NOT NULL DEFAULT 0;
    `);
  },
};
