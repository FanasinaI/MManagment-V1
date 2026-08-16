import { describe, expect, it } from 'vitest';

import { restoreDatabase } from './restore';
import type { DbConnection } from './types';
import type { BackupPayload } from '@/validation/backupSchema';

function createFakeDb() {
  const calls: { kind: 'exec' | 'run'; sql: string; params?: unknown }[] = [];
  const db: DbConnection = {
    async execAsync(sql) {
      calls.push({ kind: 'exec', sql });
    },
    async runAsync(sql, params) {
      calls.push({ kind: 'run', sql, params });
      return { lastInsertRowId: 0, changes: 1 };
    },
    async getAllAsync() {
      return [];
    },
    async getFirstAsync() {
      return null;
    },
    async withTransactionAsync(action) {
      await action();
    },
  };
  return { db, calls };
}

const payload: BackupPayload = {
  version: 1,
  exportedAt: '2026-08-16T00:00:00.000Z',
  accounts: [{ id: 'acc-1', name: 'MVola', provider: 'mvola', type: 'mobile_money', currency: 'MGA', balance: 50000, sortOrder: 0, isDefault: true }],
  transactions: [
    {
      id: 'tx-1',
      accountId: 'acc-1',
      toAccountId: null,
      type: 'income',
      amount: 10000,
      categoryId: null,
      source: 'manual',
      status: 'confirmed',
      occurredAt: '2026-08-01T00:00:00.000Z',
      hash: null,
      note: null,
      reportedBalance: null,
    },
  ],
  categories: [{ id: 'cat-1', name: 'Alimentation', icon: null }],
  budgets: [{ id: 'b-1', categoryId: 'cat-1', amount: 100000, period: 'monthly', threshold: 0.8 }],
  savings: [{ id: 's-1', name: 'Vacances', targetAmount: 500000, balance: 20000 }],
  goals: [{ id: 'g-1', name: 'Voiture', targetAmount: 2000000, currentAmount: 300000, targetDate: null }],
  smsSources: [
    {
      id: 'src-1',
      name: 'MVola',
      provider: 'mvola',
      senderPattern: 'MVola',
      enabled: true,
      parserVersion: 'v1',
      autoConfirm: false,
      accountId: null,
    },
  ],
  alerts: [{ id: 'al-1', type: 'low_balance', threshold: 10000, enabled: true }],
};

describe('restoreDatabase', () => {
  it('clears every table before inserting anything', async () => {
    const { db, calls } = createFakeDb();
    await restoreDatabase(db, payload);

    const firstInsertIndex = calls.findIndex((c) => c.kind === 'run');
    const deletes = calls.filter((c) => c.kind === 'exec' && c.sql.startsWith('DELETE FROM'));

    expect(deletes.length).toBeGreaterThanOrEqual(9);
    expect(deletes.every((_, i) => calls.indexOf(deletes[i]) < firstInsertIndex)).toBe(true);
  });

  it('inserts every entity preserving its original id', async () => {
    const { db, calls } = createFakeDb();
    await restoreDatabase(db, payload);

    const inserts = calls.filter((c) => c.kind === 'run');
    const accountInsert = inserts.find((c) => c.sql.includes('INSERT INTO accounts'));
    expect((accountInsert?.params as unknown[])[0]).toBe('acc-1');

    const txInsert = inserts.find((c) => c.sql.includes('INSERT INTO transactions'));
    expect((txInsert?.params as unknown[])[0]).toBe('tx-1');
    expect((txInsert?.params as unknown[])[1]).toBe('acc-1');
  });

  it('runs as a single transaction', async () => {
    let transactionCount = 0;
    const { db } = createFakeDb();
    const wrapped: DbConnection = {
      ...db,
      async withTransactionAsync(action) {
        transactionCount += 1;
        await action();
      },
    };
    await restoreDatabase(wrapped, payload);
    expect(transactionCount).toBe(1);
  });

  it('handles an empty payload without throwing', async () => {
    const { db } = createFakeDb();
    const empty: BackupPayload = { ...payload, accounts: [], transactions: [], categories: [], budgets: [], savings: [], goals: [], smsSources: [], alerts: [] };
    await expect(restoreDatabase(db, empty)).resolves.toBeUndefined();
  });
});
