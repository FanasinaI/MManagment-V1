import { describe, expect, it } from 'vitest';

import { cashflow, computeBalanceEffects, signedAmount, totalBalance } from './balances';

describe('signedAmount', () => {
  it('is positive for inflow types', () => {
    expect(signedAmount({ type: 'income', amount: 10000 })).toBe(10000);
    expect(signedAmount({ type: 'deposit', amount: 10000 })).toBe(10000);
  });

  it('is negative for outflow types', () => {
    expect(signedAmount({ type: 'expense', amount: 10000 })).toBe(-10000);
    expect(signedAmount({ type: 'withdrawal', amount: 10000 })).toBe(-10000);
    expect(signedAmount({ type: 'fee', amount: 10000 })).toBe(-10000);
  });
});

describe('computeBalanceEffects', () => {
  it('produces a single-account effect for a non-transfer transaction', () => {
    expect(computeBalanceEffects({ accountId: 'a1', type: 'expense', amount: 5000 })).toEqual([{ accountId: 'a1', delta: -5000 }]);
  });

  it('moves the amount out of the source account and into the destination for a transfer', () => {
    const effects = computeBalanceEffects({ accountId: 'a1', toAccountId: 'a2', type: 'transfer', amount: 20000 });
    expect(effects).toEqual([
      { accountId: 'a1', delta: -20000 },
      { accountId: 'a2', delta: 20000 },
    ]);
  });

  it('reverses both legs when sign is -1', () => {
    const effects = computeBalanceEffects({ accountId: 'a1', toAccountId: 'a2', type: 'transfer', amount: 20000 }, -1);
    expect(effects).toEqual([
      { accountId: 'a1', delta: 20000 },
      { accountId: 'a2', delta: -20000 },
    ]);
  });

  it('falls back to a single-account effect for a transfer missing a destination', () => {
    expect(computeBalanceEffects({ accountId: 'a1', type: 'transfer', amount: 20000 })).toEqual([{ accountId: 'a1', delta: 20000 }]);
  });
});

describe('totalBalance / cashflow', () => {
  it('sums account balances', () => {
    expect(totalBalance([{ balance: 100 }, { balance: 250 }])).toBe(350);
  });

  it('only counts confirmed transactions and excludes transfers from income/expense', () => {
    const result = cashflow([
      { type: 'income', amount: 10000, status: 'confirmed' },
      { type: 'expense', amount: 4000, status: 'confirmed' },
      { type: 'expense', amount: 9999, status: 'pending' },
      { type: 'transfer', amount: 5000, status: 'confirmed' },
    ]);
    expect(result).toEqual({ income: 10000, expense: 4000, net: 6000 });
  });
});
