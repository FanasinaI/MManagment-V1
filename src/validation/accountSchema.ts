import { z } from 'zod';

export const accountProviderSchema = z.enum(['mvola', 'airtel_money', 'orange_money', 'bank', 'cash', 'card', 'savings']);
export const accountTypeSchema = z.enum(['mobile_money', 'bank', 'cash', 'card', 'savings']);

export const accountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: accountProviderSchema,
  type: accountTypeSchema,
  currency: z.string().min(1).default('MGA'),
  balance: z.number(),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
});

export const newAccountSchema = accountSchema.omit({ id: true, sortOrder: true, isDefault: true });

export type Account = z.infer<typeof accountSchema>;
export type NewAccount = z.infer<typeof newAccountSchema>;
