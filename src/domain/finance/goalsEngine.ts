import { daysUntil } from '@/utils/date';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null; // ISO date
}

export interface GoalProgress {
  goalId: string;
  progressRatio: number;
  remaining: number;
  daysRemaining: number | null;
  isNear: boolean;
}

const NEAR_PROGRESS_RATIO = 0.9;
const NEAR_DAYS_REMAINING = 7;

export function computeGoalProgress(goal: Goal, reference: Date = new Date()): GoalProgress {
  const progressRatio = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const daysRemaining = goal.targetDate ? daysUntil(new Date(goal.targetDate), reference) : null;
  const isNear =
    progressRatio >= NEAR_PROGRESS_RATIO ||
    (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= NEAR_DAYS_REMAINING);

  return { goalId: goal.id, progressRatio, remaining, daysRemaining, isNear };
}
