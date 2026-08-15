import type { AccountBalance } from './balances';
import type { BudgetProgress } from './budgetEngine';
import type { GoalProgress } from './goalsEngine';

export type AlertType = 'budget_80' | 'budget_100' | 'low_balance' | 'goal_near' | 'savings_reminder';

export interface AlertCondition {
  type: AlertType;
  threshold?: number;
  enabled: boolean;
}

export interface AlertEvaluationInput {
  budgetProgresses: BudgetProgress[];
  accountBalances: AccountBalance[];
  goalProgresses: GoalProgress[];
  lowBalanceThreshold: number;
}

export interface TriggeredAlert {
  type: AlertType;
  message: string;
  refId: string;
}

/**
 * Evaluates CDC §10 alert conditions against current financial state.
 * `savings_reminder` is date-driven (e.g. the 25th of the month) and is
 * scheduled directly by services/notifications, not computed here.
 */
export function evaluateAlerts(conditions: AlertCondition[], input: AlertEvaluationInput): TriggeredAlert[] {
  const triggered: TriggeredAlert[] = [];

  for (const condition of conditions) {
    if (!condition.enabled) continue;

    if (condition.type === 'budget_80') {
      for (const bp of input.budgetProgresses) {
        if (bp.isNearThreshold) {
          triggered.push({ type: 'budget_80', message: `Budget à ${Math.round(bp.ratio * 100)}%`, refId: bp.budgetId });
        }
      }
    } else if (condition.type === 'budget_100') {
      for (const bp of input.budgetProgresses) {
        if (bp.isOverBudget) triggered.push({ type: 'budget_100', message: 'Budget dépassé', refId: bp.budgetId });
      }
    } else if (condition.type === 'low_balance') {
      const threshold = condition.threshold ?? input.lowBalanceThreshold;
      for (const account of input.accountBalances) {
        if (account.balance < threshold) {
          triggered.push({ type: 'low_balance', message: 'Solde faible', refId: account.accountId });
        }
      }
    } else if (condition.type === 'goal_near') {
      for (const gp of input.goalProgresses) {
        if (gp.isNear) triggered.push({ type: 'goal_near', message: 'Objectif proche', refId: gp.goalId });
      }
    }
  }

  return triggered;
}
