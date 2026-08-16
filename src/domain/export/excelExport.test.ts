import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';

import { buildWorkbook, workbookToBytes, type ExcelExportData } from './excelExport';

const data: ExcelExportData = {
  accounts: [{ id: 'a1', name: 'MVola', provider: 'mvola', type: 'mobile_money', currency: 'MGA', balance: 450000 }],
  categories: [{ id: 'c1', name: 'Alimentation', icon: null }],
  transactions: [
    {
      id: 't1',
      accountId: 'a1',
      type: 'expense',
      amount: 20000,
      categoryId: 'c1',
      source: 'manual',
      status: 'confirmed',
      occurredAt: '2026-08-01T00:00:00.000Z',
      hash: null,
      note: 'Marché',
    },
    {
      id: 't2',
      accountId: 'a1',
      type: 'income',
      amount: 100000,
      categoryId: null,
      source: 'sms',
      status: 'pending',
      occurredAt: '2026-08-05T00:00:00.000Z',
      hash: 'abc',
      note: null,
    },
  ],
  budgets: [{ id: 'b1', categoryId: 'c1', amount: 100000, period: 'monthly', threshold: 0.8 }],
  savings: [{ id: 's1', name: 'Vacances', targetAmount: 500000, balance: 20000 }],
  goals: [{ id: 'g1', name: 'Voiture', targetAmount: 2000000, currentAmount: 300000, targetDate: '2027-01-01T00:00:00.000Z' }],
};

describe('buildWorkbook', () => {
  it('creates all expected sheets', () => {
    const workbook = buildWorkbook(data);
    expect(workbook.SheetNames).toEqual(['Résumé', 'Comptes', 'Transactions', 'Budgets', 'Épargne', 'Objectifs']);
  });

  it('resolves account and category ids to readable names in the Transactions sheet', () => {
    const workbook = buildWorkbook(data);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Transactions']) as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    const expenseRow = rows.find((r) => r['Note'] === 'Marché');
    expect(expenseRow).toMatchObject({ Compte: 'MVola', Catégorie: 'Alimentation', Type: 'Dépense', 'Montant (Ar)': 20000 });
  });

  it('computes income/expense totals in the summary sheet from confirmed transactions only', () => {
    const workbook = buildWorkbook(data);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Résumé']) as Record<string, unknown>[];
    const expense = rows.find((r) => r['Indicateur'] === 'Dépenses (Ar)');
    const income = rows.find((r) => r['Indicateur'] === 'Revenus (Ar)');
    // t2 is 'pending', so it must not count toward income despite being an income-type transaction.
    expect(expense?.['Valeur']).toBe(20000);
    expect(income?.['Valeur']).toBe(0);
  });

  it('serializes to a non-empty byte array', () => {
    const bytes = workbookToBytes(buildWorkbook(data));
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});
