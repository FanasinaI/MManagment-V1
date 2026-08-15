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
  // 'transfer' is applied as two legs (out of source, into destination) by
  // the caller — a bare transfer amount here has no unambiguous sign.
  return transaction.amount;
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
