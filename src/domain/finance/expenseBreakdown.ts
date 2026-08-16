import { isWithinPeriod } from '@/utils/date';

export interface ExpenseBreakdownEntry {
  categoryId: string | null;
  amount: number;
}

interface ExpenseLikeTransaction {
  categoryId: string | null;
  amount: number;
  type: string;
  status: string;
  occurredAt: string;
}

/** Confirmed expense-like transactions (expense/withdrawal/fee) for the current month, grouped by category, descending. */
export function computeMonthlyExpenseByCategory(
  transactions: ExpenseLikeTransaction[],
  reference: Date = new Date()
): ExpenseBreakdownEntry[] {
  const totals = new Map<string | null, number>();

  for (const tx of transactions) {
    if (tx.status !== 'confirmed') continue;
    if (tx.type !== 'expense' && tx.type !== 'withdrawal' && tx.type !== 'fee') continue;
    if (!isWithinPeriod(new Date(tx.occurredAt), 'monthly', reference)) continue;
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + Math.abs(tx.amount));
  }

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
}
