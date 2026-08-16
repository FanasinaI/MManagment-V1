import { describe, expect, it } from 'vitest';

import { computeMonthlyTrend } from './monthlyTrend';

const reference = new Date(2026, 7, 15); // August 2026

describe('computeMonthlyTrend', () => {
  it('returns one point per month, oldest first, ending at the reference month', () => {
    const points = computeMonthlyTrend([], 3, reference);
    expect(points).toEqual([
      { year: 2026, month: 5, income: 0, expense: 0 }, // June
      { year: 2026, month: 6, income: 0, expense: 0 }, // July
      { year: 2026, month: 7, income: 0, expense: 0 }, // August
    ]);
  });

  it('sums confirmed income and expense per month and ignores out-of-range months', () => {
    const points = computeMonthlyTrend(
      [
        { amount: 100000, type: 'income', status: 'confirmed', occurredAt: '2026-08-01T00:00:00.000Z' },
        { amount: 30000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-10T00:00:00.000Z' },
        { amount: 50000, type: 'expense', status: 'confirmed', occurredAt: '2026-07-05T00:00:00.000Z' },
        { amount: 999999, type: 'expense', status: 'confirmed', occurredAt: '2020-01-01T00:00:00.000Z' },
        { amount: 20000, type: 'expense', status: 'pending', occurredAt: '2026-08-12T00:00:00.000Z' },
      ],
      3,
      reference
    );
    expect(points[2]).toEqual({ year: 2026, month: 7, income: 100000, expense: 30000 });
    expect(points[1]).toEqual({ year: 2026, month: 6, income: 0, expense: 50000 });
  });
});
