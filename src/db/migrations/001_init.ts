import type { Migration } from '../migrationRunner';

/**
 * Initial schema. Table/column names follow CDC §11 exactly for the fields it
 * specifies; additive bookkeeping columns (createdAt/updatedAt, indexes) are
 * appended where they don't conflict with the spec.
 */
export const migration001Init: Migration = {
  version: 1,
  name: 'init',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        type TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MGA',
        balance REAL NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        categoryId TEXT REFERENCES categories(id) ON DELETE SET NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        status TEXT NOT NULL DEFAULT 'confirmed',
        occurredAt TEXT NOT NULL,
        hash TEXT,
        note TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash) WHERE hash IS NOT NULL;

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        categoryId TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        period TEXT NOT NULL,
        threshold REAL NOT NULL DEFAULT 0.8
      );

      CREATE TABLE IF NOT EXISTS savings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetAmount REAL,
        balance REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL DEFAULT 0,
        targetDate TEXT
      );

      CREATE TABLE IF NOT EXISTS sms_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        senderPattern TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        parserVersion TEXT NOT NULL DEFAULT 'v1',
        provider TEXT NOT NULL
      );

      -- Deliberately no raw-content column: CDC §6 forbids retaining SMS text
      -- by default. See 002_add_sms_diagnostics.ts for the opt-in exception.
      CREATE TABLE IF NOT EXISTS sms_events (
        id TEXT PRIMARY KEY,
        sourceId TEXT REFERENCES sms_sources(id) ON DELETE SET NULL,
        receivedAt TEXT NOT NULL,
        hash TEXT,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        threshold REAL,
        enabled INTEGER NOT NULL DEFAULT 1
      );
    `);
  },
};
