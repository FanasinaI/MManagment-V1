export interface TransactionListFilters {
  query: string;
  accountId: string | null;
  type: string | null;
  dateFrom: string | null; // ISO date, inclusive
  dateTo: string | null; // ISO date, inclusive
  amountMin: number | null;
  amountMax: number | null;
}

export const EMPTY_TRANSACTION_FILTERS: TransactionListFilters = {
  query: '',
  accountId: null,
  type: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
};

export function hasActiveFilters(filters: TransactionListFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.accountId !== null ||
    filters.type !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.amountMin !== null ||
    filters.amountMax !== null
  );
}

/**
 * Generic so callers pass small accessor functions rather than this module
 * needing to know the Transaction shape — keeps it reusable and trivially
 * testable with plain fixtures.
 */
export function applyTransactionFilters<T>(
  transactions: T[],
  filters: TransactionListFilters,
  accessors: {
    searchableText: (tx: T) => string;
    accountId: (tx: T) => string;
    type: (tx: T) => string;
    occurredAt: (tx: T) => string;
    amount: (tx: T) => number;
  }
): T[] {
  const query = filters.query.trim().toLowerCase();
  const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const to = filters.dateTo ? new Date(filters.dateTo).getTime() : null;

  return transactions.filter((tx) => {
    if (filters.accountId && accessors.accountId(tx) !== filters.accountId) return false;
    if (filters.type && accessors.type(tx) !== filters.type) return false;
    if (query && !accessors.searchableText(tx).toLowerCase().includes(query)) return false;

    if (from !== null || to !== null) {
      const occurredAt = new Date(accessors.occurredAt(tx)).getTime();
      if (from !== null && occurredAt < from) return false;
      if (to !== null && occurredAt > to) return false;
    }

    const amount = Math.abs(accessors.amount(tx));
    if (filters.amountMin !== null && amount < filters.amountMin) return false;
    if (filters.amountMax !== null && amount > filters.amountMax) return false;

    return true;
  });
}
