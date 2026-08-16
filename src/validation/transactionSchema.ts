import { z } from 'zod';

export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer', 'fee', 'withdrawal', 'deposit']);
export const transactionSourceSchema = z.enum(['manual', 'sms']);
export const transactionStatusSchema = z.enum(['pending', 'confirmed', 'rejected']);

export const transactionSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  toAccountId: z.string().min(1).nullable(),
  type: transactionTypeSchema,
  amount: z.number(),
  categoryId: z.string().min(1).nullable(),
  source: transactionSourceSchema.default('manual'),
  status: transactionStatusSchema.default('confirmed'),
  occurredAt: z.string().min(1),
  hash: z.string().nullable(),
  note: z.string().nullable(),
});

export const newManualTransactionSchema = z
  .object({
    accountId: z.string().min(1),
    toAccountId: z.string().min(1).optional(),
    type: transactionTypeSchema,
    amount: z.number().positive('Le montant doit être positif'),
    categoryId: z.string().min(1).nullable().optional(),
    occurredAt: z.string().min(1),
    note: z.string().max(280).optional(),
  })
  .refine((data) => data.type !== 'transfer' || (!!data.toAccountId && data.toAccountId !== data.accountId), {
    message: 'Choisissez un compte de destination différent du compte source',
    path: ['toAccountId'],
  });

export type Transaction = z.infer<typeof transactionSchema>;
export type NewManualTransaction = z.infer<typeof newManualTransactionSchema>;
