import { z } from 'zod';

import { transactionTypeSchema } from './transactionSchema';

export const recurrenceFrequencySchema = z.enum(['weekly', 'monthly', 'yearly']);

export const recurringTransactionSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  toAccountId: z.string().min(1).nullable(),
  type: transactionTypeSchema,
  amount: z.number().positive(),
  categoryId: z.string().min(1).nullable(),
  note: z.string().nullable(),
  frequency: recurrenceFrequencySchema,
  nextOccurrence: z.string().min(1),
  active: z.boolean().default(true),
});

export const newRecurringTransactionSchema = z
  .object({
    accountId: z.string().min(1),
    toAccountId: z.string().min(1).optional(),
    type: transactionTypeSchema,
    amount: z.number().positive('Le montant doit être positif'),
    categoryId: z.string().min(1).nullable().optional(),
    note: z.string().max(280).optional(),
    frequency: recurrenceFrequencySchema,
    nextOccurrence: z.string().min(1),
  })
  .refine((data) => data.type !== 'transfer' || (!!data.toAccountId && data.toAccountId !== data.accountId), {
    message: 'Choisissez un compte de destination différent du compte source',
    path: ['toAccountId'],
  });

export type RecurringTransaction = z.infer<typeof recurringTransactionSchema>;
export type NewRecurringTransaction = z.infer<typeof newRecurringTransactionSchema>;
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>;
