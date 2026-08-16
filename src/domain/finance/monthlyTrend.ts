interface TrendTransaction {
  amount: number;
  type: string;
  status: string;
  occurredAt: string;
}

export interface MonthlyTrendPoint {
  year: number;
  month: number; // 0-11
  income: number;
  expense: number;
}

const INFLOW_TYPES = new Set(['income', 'deposit']);
const OUTFLOW_TYPES = new Set(['expense', 'withdrawal', 'fee']);

/** Confirmed income/expense totals per calendar month, oldest first, for the last `monthsBack` months including the reference month. */
export function computeMonthlyTrend(
  transactions: TrendTransaction[],
  monthsBack = 6,
  reference: Date = new Date()
): MonthlyTrendPoint[] {
  const points: MonthlyTrendPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    points.push({ year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 });
  }

  const indexFor = new Map(points.map((p, i) => [`${p.year}-${p.month}`, i]));

  for (const tx of transactions) {
    if (tx.status !== 'confirmed') continue;
    const d = new Date(tx.occurredAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const index = indexFor.get(key);
    if (index === undefined) continue;

    if (INFLOW_TYPES.has(tx.type)) points[index].income += Math.abs(tx.amount);
    else if (OUTFLOW_TYPES.has(tx.type)) points[index].expense += Math.abs(tx.amount);
  }

  return points;
}
