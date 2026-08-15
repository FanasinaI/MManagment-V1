import { z } from 'zod';

export const savingsSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetAmount: z.number().positive().nullable(),
  balance: z.number().default(0),
});

export const newSavingsSchema = savingsSchema.omit({ id: true, balance: true });

export type SavingsPocket = z.infer<typeof savingsSchema>;
export type NewSavingsPocket = z.infer<typeof newSavingsSchema>;
