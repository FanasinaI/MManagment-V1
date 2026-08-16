export interface AccountBalance {
  accountId: string;
  balance: number;
}

export interface TransactionAmount {
  accountId: string;
  type: string;
  amount: number;
  status: string;
}

const INFLOW_TYPES = new Set(['income', 'deposit']);
const OUTFLOW_TYPES = new Set(['expense', 'withdrawal', 'fee']);

/** Signed delta a confirmed transaction applies to its account's balance. */
export function signedAmount(transaction: Pick<TransactionAmount, 'type' | 'amount'>): number {
  const magnitude = Math.abs(transaction.amount);
  if (INFLOW_TYPES.has(transaction.type)) return magnitude;
  if (OUTFLOW_TYPES.has(transaction.type)) return -magnitude;
  // 'transfer' is handled separately by computeBalanceEffects (two legs) —
  // a bare transfer amount here has no unambiguous single-account sign.
  return transaction.amount;
}

export interface BalanceEffect {
  accountId: string;
  delta: number;
}

/**
 * What balance deltas a transaction causes, as a list of {accountId, delta}
 * to apply. A transfer produces two legs (out of `accountId`, into
 * `toAccountId`); every other type produces one, via `signedAmount`. Pass
 * `sign: -1` to get the deltas that *reverse* the effect (e.g. on delete).
 */
export function computeBalanceEffects(
  transaction: Pick<TransactionAmount, 'type' | 'amount' | 'accountId'> & { toAccountId?: string | null },
  sign: 1 | -1 = 1
): BalanceEffect[] {
  if (transaction.type === 'transfer' && transaction.toAccountId) {
    const magnitude = Math.abs(transaction.amount);
    return [
      { accountId: transaction.accountId, delta: -sign * magnitude },
      { accountId: transaction.toAccountId, delta: sign * magnitude },
    ];
  }
  return [{ accountId: transaction.accountId, delta: sign * signedAmount(transaction) }];
}

export function totalBalance(accounts: Pick<AccountBalance, 'balance'>[]): number {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

export function cashflow(transactions: Pick<TransactionAmount, 'type' | 'amount' | 'status'>[]): {
  income: number;
  expense: number;
  net: number;
} {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.status !== 'confirmed') continue;
    if (INFLOW_TYPES.has(tx.type)) income += Math.abs(tx.amount);
    if (OUTFLOW_TYPES.has(tx.type)) expense += Math.abs(tx.amount);
  }
  return { income, expense, net: income - expense };
}
