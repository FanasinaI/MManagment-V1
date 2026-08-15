import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrationRunner';
import { migrations } from './migrations';
import type { DbConnection } from './types';

const DATABASE_NAME = 'mmanagment.db';

let dbPromise: Promise<DbConnection> | null = null;

async function openConnection(): Promise<DbConnection> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

/**
 * Returns a singleton, migrated database connection. Safe to call from
 * multiple places (stores, services) — the underlying open + migrate work
 * only happens once per app session.
 */
export function getDb(): Promise<DbConnection> {
  if (!dbPromise) {
    dbPromise = openConnection().then(async (db) => {
      await runMigrations(db, migrations);
      return db;
    });
  }
  return dbPromise;
}
