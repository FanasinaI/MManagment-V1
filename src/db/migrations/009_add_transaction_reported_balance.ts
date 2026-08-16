import type { Migration } from '../migrationRunner';

/**
 * Some mobile money/bank SMS report the post-transaction balance alongside
 * the transaction amount (e.g. "Nouveau solde: 150000 Ar" —
 * extractReportedBalance). Stashed here on the pending row so that at
 * confirm() time the account balance can be reconciled to that reported
 * figure instead of just adding the transaction's own amount, which
 * self-heals any drift instead of compounding it. NULL for manual entries
 * and for any SMS that didn't mention a balance.
 */
export const migration009AddTransactionReportedBalance: Migration = {
  version: 9,
  name: 'add_transaction_reported_balance',
  up: async (db) => {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN reportedBalance REAL;`);
  },
};
