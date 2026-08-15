import { z } from 'zod';

export const goalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().default(0),
  targetDate: z.string().nullable(),
});

export const newGoalSchema = goalSchema.omit({ id: true, currentAmount: true });

export type Goal = z.infer<typeof goalSchema>;
export type NewGoal = z.infer<typeof newGoalSchema>;
