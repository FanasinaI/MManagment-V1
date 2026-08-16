import { describe, expect, it } from 'vitest';

import { applyTransactionFilters, hasActiveFilters, type TransactionListFilters } from './transactionFilters';

interface FixtureTx {
  id: string;
  accountId: string;
  type: string;
  note: string | null;
  categoryName: string;
}

const transactions: FixtureTx[] = [
  { id: 't1', accountId: 'a1', type: 'expense', note: 'Courses au marché', categoryName: 'Alimentation' },
  { id: 't2', accountId: 'a2', type: 'income', note: null, categoryName: 'Salaire' },
  { id: 't3', accountId: 'a1', type: 'transfer', note: 'Vers épargne', categoryName: '' },
];

const accessors = {
  searchableText: (tx: FixtureTx) => `${tx.note ?? ''} ${tx.categoryName}`,
  accountId: (tx: FixtureTx) => tx.accountId,
  type: (tx: FixtureTx) => tx.type,
};

function filters(overrides: Partial<TransactionListFilters> = {}): TransactionListFilters {
  return { query: '', accountId: null, type: null, ...overrides };
}

describe('applyTransactionFilters', () => {
  it('returns everything when no filter is active', () => {
    expect(applyTransactionFilters(transactions, filters(), accessors)).toHaveLength(3);
  });

  it('filters by account', () => {
    const result = applyTransactionFilters(transactions, filters({ accountId: 'a1' }), accessors);
    expect(result.map((t) => t.id)).toEqual(['t1', 't3']);
  });

  it('filters by type', () => {
    const result = applyTransactionFilters(transactions, filters({ type: 'income' }), accessors);
    expect(result.map((t) => t.id)).toEqual(['t2']);
  });

  it('filters by a case-insensitive text search over note and category', () => {
    expect(applyTransactionFilters(transactions, filters({ query: 'marché' }), accessors).map((t) => t.id)).toEqual(['t1']);
    expect(applyTransactionFilters(transactions, filters({ query: 'SALAIRE' }), accessors).map((t) => t.id)).toEqual(['t2']);
  });

  it('combines filters with AND semantics', () => {
    const result = applyTransactionFilters(transactions, filters({ accountId: 'a1', query: 'épargne' }), accessors);
    expect(result.map((t) => t.id)).toEqual(['t3']);
  });
});

describe('hasActiveFilters', () => {
  it('is false when nothing is set', () => {
    expect(hasActiveFilters(filters())).toBe(false);
  });

  it('is true when any field is set', () => {
    expect(hasActiveFilters(filters({ query: 'x' }))).toBe(true);
    expect(hasActiveFilters(filters({ accountId: 'a1' }))).toBe(true);
    expect(hasActiveFilters(filters({ type: 'income' }))).toBe(true);
  });
});
