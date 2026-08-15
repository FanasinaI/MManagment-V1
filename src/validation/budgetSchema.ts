import { z } from 'zod';

export const budgetPeriodSchema = z.enum(['weekly', 'monthly', 'yearly']);

export const budgetSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  period: budgetPeriodSchema,
  threshold: z.number().min(0).max(1).default(0.8),
});

export const newBudgetSchema = budgetSchema.omit({ id: true });

export type Budget = z.infer<typeof budgetSchema>;
export type NewBudget = z.infer<typeof newBudgetSchema>;
