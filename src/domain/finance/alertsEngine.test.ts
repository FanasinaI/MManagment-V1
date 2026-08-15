import { describe, expect, it } from 'vitest';

import { evaluateAlerts, type AlertCondition, type AlertEvaluationInput } from './alertsEngine';

const baseInput: AlertEvaluationInput = {
  budgetProgresses: [{ budgetId: 'b1', spent: 90000, amount: 100000, ratio: 0.9, isNearThreshold: true, isOverBudget: false }],
  accountBalances: [{ accountId: 'a1', balance: 5000 }],
  goalProgresses: [{ goalId: 'g1', progressRatio: 0.95, remaining: 5000, daysRemaining: 3, isNear: true }],
  lowBalanceThreshold: 10000,
};

describe('evaluateAlerts', () => {
  it('skips disabled conditions', () => {
    const conditions: AlertCondition[] = [{ type: 'budget_80', enabled: false }];
    expect(evaluateAlerts(conditions, baseInput)).toEqual([]);
  });

  it('triggers budget_80 when a budget is near its threshold', () => {
    const conditions: AlertCondition[] = [{ type: 'budget_80', enabled: true }];
    const alerts = evaluateAlerts(conditions, baseInput);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ type: 'budget_80', refId: 'b1' });
  });

  it('triggers low_balance using the condition threshold over the default', () => {
    const conditions: AlertCondition[] = [{ type: 'low_balance', enabled: true, threshold: 4000 }];
    expect(evaluateAlerts(conditions, baseInput)).toEqual([]);

    const conditionsDefault: AlertCondition[] = [{ type: 'low_balance', enabled: true }];
    const alerts = evaluateAlerts(conditionsDefault, baseInput);
    expect(alerts[0]).toMatchObject({ type: 'low_balance', refId: 'a1' });
  });

  it('triggers goal_near for goals close to completion or deadline', () => {
    const conditions: AlertCondition[] = [{ type: 'goal_near', enabled: true }];
    const alerts = evaluateAlerts(conditions, baseInput);
    expect(alerts[0]).toMatchObject({ type: 'goal_near', refId: 'g1' });
  });
});
