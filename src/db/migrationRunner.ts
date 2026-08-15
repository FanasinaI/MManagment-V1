import type { DbConnection } from './types';

export interface Migration {
  version: number;
  name: string;
  up: (db: DbConnection) => Promise<void>;
}

interface MigrationRow {
  version: number;
}

const ENSURE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    appliedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

/**
 * Applies pending migrations in ascending version order, one transaction per
 * migration (a failure stops the run but leaves already-applied migrations
 * committed — CDC §15 "migrations SQLite versionnées"). `migrations` must be
 * pre-sorted by the caller; this function does not sort defensively so that
 * ordering bugs in `migrations/index.ts` surface immediately.
 */
export async function runMigrations(db: DbConnection, migrations: Migration[]): Promise<void> {
  await db.execAsync(ENSURE_TABLE_SQL);

  const appliedRows = await db.getAllAsync<MigrationRow>('SELECT version FROM schema_migrations;');
  const applied = new Set(appliedRows.map((row) => row.version));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync('INSERT INTO schema_migrations (version, name) VALUES (?, ?);', [
        migration.version,
        migration.name,
      ]);
    });
  }
}
