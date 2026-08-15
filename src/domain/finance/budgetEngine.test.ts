import { describe, expect, it } from 'vitest';

import { computeBudgetProgress, type Budget, type CategorizedTransaction } from './budgetEngine';

const budget: Budget = { id: 'b1', categoryId: 'cat-food', amount: 100000, period: 'monthly', threshold: 0.8 };
const reference = new Date('2026-08-15T00:00:00.000Z');

describe('computeBudgetProgress', () => {
  it('sums confirmed expenses in the category and period', () => {
    const transactions: CategorizedTransaction[] = [
      { categoryId: 'cat-food', amount: 30000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
      { categoryId: 'cat-food', amount: 20000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-10T00:00:00.000Z' },
    ];
    const progress = computeBudgetProgress(budget, transactions, reference);
    expect(progress.spent).toBe(50000);
    expect(progress.ratio).toBeCloseTo(0.5);
    expect(progress.isNearThreshold).toBe(false);
    expect(progress.isOverBudget).toBe(false);
  });

  it('ignores pending transactions, other categories, and other periods', () => {
    const transactions: CategorizedTransaction[] = [
      { categoryId: 'cat-food', amount: 30000, type: 'expense', status: 'pending', occurredAt: '2026-08-05T00:00:00.000Z' },
      { categoryId: 'cat-transport', amount: 30000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
      { categoryId: 'cat-food', amount: 30000, type: 'expense', status: 'confirmed', occurredAt: '2026-07-05T00:00:00.000Z' },
    ];
    expect(computeBudgetProgress(budget, transactions, reference).spent).toBe(0);
  });

  it('flags isNearThreshold at 80% and isOverBudget at 100%+', () => {
    const near: CategorizedTransaction[] = [
      { categoryId: 'cat-food', amount: 85000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
    ];
    expect(computeBudgetProgress(budget, near, reference).isNearThreshold).toBe(true);

    const over: CategorizedTransaction[] = [
      { categoryId: 'cat-food', amount: 120000, type: 'expense', status: 'confirmed', occurredAt: '2026-08-05T00:00:00.000Z' },
    ];
    const overProgress = computeBudgetProgress(budget, over, reference);
    expect(overProgress.isOverBudget).toBe(true);
    expect(overProgress.isNearThreshold).toBe(false);
  });
});
