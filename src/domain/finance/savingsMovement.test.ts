import { describe, expect, it } from 'vitest';

import { computeMonthlySavingsMovement, computeSavingsMovementTotals, isSavingsMovement } from './savingsMovement';

describe('isSavingsMovement', () => {
  it('is true for a transfer with no destination account', () => {
    expect(isSavingsMovement({ type: 'transfer', toAccountId: null })).toBe(true);
  });

  it('is false for a real account-to-account transfer', () => {
    expect(isSavingsMovement({ type: 'transfer', toAccountId: 'acc-2' })).toBe(false);
  });

  it('is false for a non-transfer type', () => {
    expect(isSavingsMovement({ type: 'expense', toAccountId: null })).toBe(false);
  });
});

const reference = new Date('2026-08-16T00:00:00.000Z');

describe('computeMonthlySavingsMovement', () => {
  it('sums deposits (negative amounts) and withdrawals (positive amounts) separately', () => {
    const transactions = [
      { type: 'transfer', toAccountId: null, amount: -20000, status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
      { type: 'transfer', toAccountId: null, amount: -5000, status: 'confirmed', occurredAt: '2026-08-10T00:00:00.000Z' },
      { type: 'transfer', toAccountId: null, amount: 8000, status: 'confirmed', occurredAt: '2026-08-12T00:00:00.000Z' },
    ];
    expect(computeMonthlySavingsMovement(transactions, reference)).toEqual({ deposited: 25000, withdrawn: 8000, net: 17000 });
  });

  it('excludes real transfers, unconfirmed transactions, categorized expenses, and other months', () => {
    const transactions = [
      { type: 'transfer', toAccountId: 'acc-2', amount: -20000, status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
      { type: 'transfer', toAccountId: null, amount: -20000, status: 'pending', occurredAt: '2026-08-05T00:00:00.000Z' },
      { type: 'expense', toAccountId: null, amount: -20000, status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
      { type: 'transfer', toAccountId: null, amount: -20000, status: 'confirmed', occurredAt: '2026-07-05T00:00:00.000Z' },
    ];
    expect(computeMonthlySavingsMovement(transactions, reference)).toEqual({ deposited: 0, withdrawn: 0, net: 0 });
  });
});

describe('computeSavingsMovementTotals', () => {
  it('accumulates across the requested number of months', () => {
    const transactions = [
      { type: 'transfer', toAccountId: null, amount: -20000, status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
      { type: 'transfer', toAccountId: null, amount: -10000, status: 'confirmed', occurredAt: '2026-07-05T00:00:00.000Z' },
      { type: 'transfer', toAccountId: null, amount: -10000, status: 'confirmed', occurredAt: '2026-01-05T00:00:00.000Z' },
    ];
    expect(computeSavingsMovementTotals(transactions, 2, reference)).toEqual({ deposited: 30000, withdrawn: 0, net: 30000 });
  });
});
