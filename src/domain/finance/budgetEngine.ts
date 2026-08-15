import { isWithinPeriod, type BudgetPeriod } from '@/utils/date';

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  threshold: number; // e.g. 0.8 for an 80% alert
}

export interface CategorizedTransaction {
  categoryId: string | null;
  amount: number;
  type: string;
  status: string;
  occurredAt: string; // ISO
}

export interface BudgetProgress {
  budgetId: string;
  spent: number;
  amount: number;
  ratio: number;
  isNearThreshold: boolean;
  isOverBudget: boolean;
}

export function computeBudgetProgress(
  budget: Budget,
  transactions: CategorizedTransaction[],
  reference: Date = new Date()
): BudgetProgress {
  const spent = transactions
    .filter((tx) => tx.categoryId === budget.categoryId && tx.type === 'expense' && tx.status === 'confirmed')
    .filter((tx) => isWithinPeriod(new Date(tx.occurredAt), budget.period, reference))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const ratio = budget.amount > 0 ? spent / budget.amount : 0;

  return {
    budgetId: budget.id,
    spent,
    amount: budget.amount,
    ratio,
    isNearThreshold: ratio >= budget.threshold && ratio < 1,
    isOverBudget: ratio >= 1,
  };
}
