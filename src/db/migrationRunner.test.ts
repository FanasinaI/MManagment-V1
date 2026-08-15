import { describe, expect, it } from 'vitest';

import { runMigrations, type Migration } from './migrationRunner';
import type { DbConnection } from './types';

function createFakeDb(initiallyApplied: number[] = []) {
  const appliedVersions = [...initiallyApplied];
  const executed: string[] = [];

  const db: DbConnection = {
    async execAsync(sql) {
      executed.push(sql);
    },
    async runAsync(sql, params) {
      executed.push(sql);
      if (sql.includes('INSERT INTO schema_migrations')) {
        const [version] = params as [number, string];
        appliedVersions.push(version);
      }
      return { lastInsertRowId: 0, changes: 1 };
    },
    async getAllAsync<T>(sql: string) {
      if (sql.includes('schema_migrations')) {
        return appliedVersions.map((version) => ({ version })) as T[];
      }
      return [] as T[];
    },
    async getFirstAsync<T>() {
      return null as T | null;
    },
    async withTransactionAsync(action) {
      await action();
    },
  };

  return { db, executed, appliedVersions };
}

function makeMigration(version: number, up: Migration['up'] = async () => {}): Migration {
  return { version, name: `migration_${version}`, up };
}

describe('runMigrations', () => {
  it('applies all migrations in order on a fresh database', async () => {
    const { db, appliedVersions } = createFakeDb();
    const order: number[] = [];
    const migrations = [
      makeMigration(1, async () => {
        order.push(1);
      }),
      makeMigration(2, async () => {
        order.push(2);
      }),
      makeMigration(3, async () => {
        order.push(3);
      }),
    ];

    await runMigrations(db, migrations);

    expect(order).toEqual([1, 2, 3]);
    expect(appliedVersions).toEqual([1, 2, 3]);
  });

  it('skips migrations that are already applied (idempotent)', async () => {
    const { db, appliedVersions } = createFakeDb([1]);
    const ran: number[] = [];
    const migrations = [
      makeMigration(1, async () => {
        ran.push(1);
      }),
      makeMigration(2, async () => {
        ran.push(2);
      }),
    ];

    await runMigrations(db, migrations);

    expect(ran).toEqual([2]);
    expect(appliedVersions).toEqual([1, 2]);
  });

  it('stops on the first failing migration and leaves prior ones committed', async () => {
    const { db, appliedVersions } = createFakeDb();
    const ran: number[] = [];
    const migrations = [
      makeMigration(1, async () => {
        ran.push(1);
      }),
      makeMigration(2, async () => {
        ran.push(2);
        throw new Error('boom');
      }),
      makeMigration(3, async () => {
        ran.push(3);
      }),
    ];

    await expect(runMigrations(db, migrations)).rejects.toThrow('boom');

    expect(ran).toEqual([1, 2]);
    expect(appliedVersions).toEqual([1]);
  });

  it('running twice in a row is a no-op the second time', async () => {
    const { db, appliedVersions } = createFakeDb();
    const ran: number[] = [];
    const migrations = [
      makeMigration(1, async () => {
        ran.push(1);
      }),
      makeMigration(2, async () => {
        ran.push(2);
      }),
    ];

    await runMigrations(db, migrations);
    await runMigrations(db, migrations);

    expect(ran).toEqual([1, 2]);
    expect(appliedVersions).toEqual([1, 2]);
  });
});
