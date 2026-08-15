export interface SavingsPocket {
  id: string;
  name: string;
  targetAmount: number | null;
  balance: number;
}

export interface SavingsProgress {
  pocketId: string;
  balance: number;
  targetAmount: number | null;
  progressRatio: number | null;
  remaining: number | null;
}

export function computeSavingsProgress(pocket: SavingsPocket): SavingsProgress {
  const hasTarget = pocket.targetAmount !== null && pocket.targetAmount > 0;
  return {
    pocketId: pocket.id,
    balance: pocket.balance,
    targetAmount: pocket.targetAmount,
    progressRatio: hasTarget ? pocket.balance / (pocket.targetAmount as number) : null,
    remaining: pocket.targetAmount !== null ? Math.max(pocket.targetAmount - pocket.balance, 0) : null,
  };
}
