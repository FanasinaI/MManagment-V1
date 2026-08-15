import { z } from 'zod';

import { accountSchema } from './accountSchema';
import { budgetSchema } from './budgetSchema';
import { goalSchema } from './goalSchema';
import { savingsSchema } from './savingsSchema';
import { smsSourceSchema } from './smsSourceSchema';
import { transactionSchema } from './transactionSchema';

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().nullable(),
});

export const alertTypeSchema = z.enum(['budget_80', 'budget_100', 'low_balance', 'goal_near', 'savings_reminder']);

export const alertSchema = z.object({
  id: z.string().min(1),
  type: alertTypeSchema,
  threshold: z.number().nullable(),
  enabled: z.boolean().default(true),
});

export const BACKUP_FORMAT_VERSION = 1;

/**
 * Shape of the decrypted contents of a `.mmbak` file (CDC §16). Validated on
 * import so a corrupted or tampered file is rejected before anything is
 * written to SQLite.
 */
export const backupPayloadSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: z.string().min(1),
  accounts: z.array(accountSchema),
  transactions: z.array(transactionSchema),
  categories: z.array(categorySchema),
  budgets: z.array(budgetSchema),
  savings: z.array(savingsSchema),
  goals: z.array(goalSchema),
  smsSources: z.array(smsSourceSchema),
  alerts: z.array(alertSchema),
});

export type Category = z.infer<typeof categorySchema>;
export type Alert = z.infer<typeof alertSchema>;
export type BackupPayload = z.infer<typeof backupPayloadSchema>;
