import { isWithinPeriod } from '@/utils/date';

interface SavingsMovementTransaction {
  type: string;
  toAccountId: string | null;
  amount: number;
  status: string;
  occurredAt: string;
}

export interface SavingsMovementTotals {
  deposited: number;
  withdrawn: number;
  net: number;
}

/**
 * A savings/goal deposit or withdrawal is logged as an ordinary `transfer`
 * transaction with no `toAccountId` (a savings pocket/goal isn't a row in
 * `accounts`) — as opposed to a real account-to-account transfer, which
 * always has one. This is the one place that convention is named, so every
 * caller that needs to tell the two apart goes through here instead of
 * re-deriving the check.
 */
export function isSavingsMovement(tx: Pick<SavingsMovementTransaction, 'type' | 'toAccountId'>): boolean {
  return tx.type === 'transfer' && tx.toAccountId === null;
}

/**
 * Money moved into vs. out of savings pockets/goals for the given month.
 * Deliberately kept out of `cashflow()`'s "dépenses" — it isn't spending,
 * the money is still the user's, just set aside — so it's reported here as
 * its own figure instead of inflating expenses.
 */
export function computeMonthlySavingsMovement(
  transactions: SavingsMovementTransaction[],
  reference: Date = new Date()
): SavingsMovementTotals {
  let deposited = 0;
  let withdrawn = 0;

  for (const tx of transactions) {
    if (tx.status !== 'confirmed') continue;
    if (!isSavingsMovement(tx)) continue;
    if (!isWithinPeriod(new Date(tx.occurredAt), 'monthly', reference)) continue;

    if (tx.amount < 0) deposited += Math.abs(tx.amount);
    else withdrawn += tx.amount;
  }

  return { deposited, withdrawn, net: deposited - withdrawn };
}

/** Same totals accumulated over `monthsBack` calendar months up to and including `reference`'s month. */
export function computeSavingsMovementTotals(
  transactions: SavingsMovementTransaction[],
  monthsBack: number,
  reference: Date = new Date()
): SavingsMovementTotals {
  let deposited = 0;
  let withdrawn = 0;

  for (let i = 0; i < monthsBack; i++) {
    const monthReference = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const monthTotals = computeMonthlySavingsMovement(transactions, monthReference);
    deposited += monthTotals.deposited;
    withdrawn += monthTotals.withdrawn;
  }

  return { deposited, withdrawn, net: deposited - withdrawn };
}
