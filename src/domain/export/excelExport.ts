import * as XLSX from 'xlsx';

import { PROVIDER_LABELS } from '@/domain/finance/accountProvider';
import type { Account } from '@/validation/accountSchema';
import type { Category } from '@/validation/backupSchema';
import type { Budget } from '@/validation/budgetSchema';
import type { Goal } from '@/validation/goalSchema';
import type { SavingsPocket } from '@/validation/savingsSchema';
import type { Transaction } from '@/validation/transactionSchema';

export interface ExcelExportData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savings: SavingsPocket[];
  goals: Goal[];
}

const TYPE_LABELS: Record<string, string> = {
  income: 'Revenu',
  expense: 'Dépense',
  transfer: 'Transfert',
  fee: 'Frais',
  withdrawal: 'Retrait',
  deposit: 'Dépôt',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  rejected: 'Rejetée',
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manuelle',
  sms: 'SMS',
};

/**
 * Builds a multi-sheet workbook (Résumé, Comptes, Transactions, Budgets,
 * Épargne, Objectifs) with French headers, ids resolved to readable names.
 * xlsx (SheetJS) is pure JS, so — unlike the SQLite/crypto adapters — this
 * is directly unit-testable under Vitest with no native module involved.
 */
export function buildWorkbook(data: ExcelExportData): XLSX.WorkBook {
  const accountNames = new Map(data.accounts.map((a) => [a.id, a.name]));
  const categoryNames = new Map(data.categories.map((c) => [c.id, c.name]));

  const workbook = XLSX.utils.book_new();

  const totalBalance = data.accounts.reduce((sum, a) => sum + a.balance, 0);
  const confirmed = data.transactions.filter((t) => t.status === 'confirmed');
  const income = confirmed.filter((t) => t.type === 'income' || t.type === 'deposit').reduce((s, t) => s + Math.abs(t.amount), 0);
  const expense = confirmed
    .filter((t) => t.type === 'expense' || t.type === 'withdrawal' || t.type === 'fee')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  appendSheet(workbook, 'Résumé', [
    { Indicateur: 'Solde total (Ar)', Valeur: totalBalance },
    { Indicateur: 'Revenus (Ar)', Valeur: income },
    { Indicateur: 'Dépenses (Ar)', Valeur: expense },
    { Indicateur: 'Nombre de comptes', Valeur: data.accounts.length },
    { Indicateur: 'Nombre de transactions', Valeur: data.transactions.length },
    { Indicateur: "Date d'export", Valeur: new Date().toISOString().slice(0, 19).replace('T', ' ') },
  ]);

  appendSheet(
    workbook,
    'Comptes',
    data.accounts.map((a) => ({
      Nom: a.name,
      Type: PROVIDER_LABELS[a.provider] ?? a.provider,
      Devise: a.currency,
      'Solde (Ar)': a.balance,
    }))
  );

  appendSheet(
    workbook,
    'Transactions',
    data.transactions
      .slice()
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
      .map((t) => ({
        Date: t.occurredAt.slice(0, 10),
        Compte: accountNames.get(t.accountId) ?? '',
        Type: TYPE_LABELS[t.type] ?? t.type,
        Catégorie: t.categoryId ? (categoryNames.get(t.categoryId) ?? '') : '',
        'Montant (Ar)': t.amount,
        Source: SOURCE_LABELS[t.source] ?? t.source,
        Statut: STATUS_LABELS[t.status] ?? t.status,
        Note: t.note ?? '',
      }))
  );

  appendSheet(
    workbook,
    'Budgets',
    data.budgets.map((b) => ({
      Catégorie: categoryNames.get(b.categoryId) ?? '',
      'Montant (Ar)': b.amount,
      Période: b.period,
      'Seuil alerte': `${Math.round(b.threshold * 100)}%`,
    }))
  );

  appendSheet(
    workbook,
    'Épargne',
    data.savings.map((s) => ({
      Nom: s.name,
      'Solde (Ar)': s.balance,
      'Objectif (Ar)': s.targetAmount ?? '',
    }))
  );

  appendSheet(
    workbook,
    'Objectifs',
    data.goals.map((g) => ({
      Nom: g.name,
      'Montant actuel (Ar)': g.currentAmount,
      'Montant cible (Ar)': g.targetAmount,
      'Date cible': g.targetDate ? g.targetDate.slice(0, 10) : '',
    }))
  );

  return workbook;
}

function appendSheet(workbook: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]): void {
  const sheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

/**
 * Serializes to bytes suitable for expo-file-system's File.write(). SheetJS's
 * `type: 'array'` output shape depends on the runtime — a real Uint8Array in
 * RN/browser-like environments, but a plain ArrayBuffer under plain Node (as
 * in this file's own Vitest run) — normalize explicitly so callers always get
 * a genuine, non-empty Uint8Array.
 */
export function workbookToBytes(workbook: XLSX.WorkBook): Uint8Array {
  const output: unknown = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  if (output instanceof Uint8Array) return output;
  if (output instanceof ArrayBuffer) return new Uint8Array(output);
  return Uint8Array.from(output as number[]);
}
