import { describe, expect, it } from 'vitest';

import { computeGoalProgress, type Goal } from './goalsEngine';

const reference = new Date('2026-08-15T00:00:00.000Z');

describe('computeGoalProgress', () => {
  it('computes progress ratio and remaining amount', () => {
    const goal: Goal = { id: 'g1', name: 'Voiture', targetAmount: 1000000, currentAmount: 400000, targetDate: null };
    const progress = computeGoalProgress(goal, reference);
    expect(progress.progressRatio).toBeCloseTo(0.4);
    expect(progress.remaining).toBe(600000);
    expect(progress.isNear).toBe(false);
  });

  it('is near when progress reaches 90%', () => {
    const goal: Goal = { id: 'g1', name: 'Voiture', targetAmount: 1000000, currentAmount: 950000, targetDate: null };
    expect(computeGoalProgress(goal, reference).isNear).toBe(true);
  });

  it('is near when the target date is within 7 days', () => {
    const goal: Goal = {
      id: 'g1',
      name: 'Voiture',
      targetAmount: 1000000,
      currentAmount: 100000,
      targetDate: '2026-08-20T00:00:00.000Z',
    };
    expect(computeGoalProgress(goal, reference).isNear).toBe(true);
  });

  it('is not near for a distant target date and low progress', () => {
    const goal: Goal = {
      id: 'g1',
      name: 'Voiture',
      targetAmount: 1000000,
      currentAmount: 100000,
      targetDate: '2027-01-01T00:00:00.000Z',
    };
    expect(computeGoalProgress(goal, reference).isNear).toBe(false);
  });
});
