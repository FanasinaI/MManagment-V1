import { describe, expect, it } from 'vitest';

import { computeMonthlyExpenseByCategory } from './expenseBreakdown';

const reference = new Date('2026-08-15T00:00:00.000Z');

describe('computeMonthlyExpenseByCategory', () => {
  it('sums expense-like transactions by category for the current month, descending', () => {
    const result = computeMonthlyExpenseByCategory(
      [
        { categoryId: 'food', amount: 30000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-01T00:00:00.000Z' },
        { categoryId: 'food', amount: 20000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-10T00:00:00.000Z' },
        { categoryId: 'transport', amount: 80000, type: 'withdrawal', status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
      ],
      reference
    );
    expect(result).toEqual([
      { categoryId: 'transport', amount: 80000 },
      { categoryId: 'food', amount: 50000 },
    ]);
  });

  it('excludes pending transactions, other months, and non-expense types', () => {
    const result = computeMonthlyExpenseByCategory(
      [
        { categoryId: 'food', amount: 30000, type: 'expense', status: 'pending', occurredAt: '2026-08-01T00:00:00.000Z' },
        { categoryId: 'food', amount: 30000, type: 'expense', status: 'confirmed', occurredAt: '2026-07-01T00:00:00.000Z' },
        { categoryId: 'food', amount: 30000, type: 'income', status: 'confirmed', occurredAt: '2026-08-01T00:00:00.000Z' },
      ],
      reference
    );
    expect(result).toEqual([]);
  });

  it('groups uncategorized transactions under a null key', () => {
    const result = computeMonthlyExpenseByCategory(
      [{ categoryId: null, amount: 15000, type: 'fee', status: 'confirmed', occurredAt: '2026-08-01T00:00:00.000Z' }],
      reference
    );
    expect(result).toEqual([{ categoryId: null, amount: 15000 }]);
  });
});
