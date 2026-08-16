/** Rotating palette for category breakdowns — categories are user-created, so colors are assigned by index. */
export const CHART_PALETTE = ['#8B6FD6', '#F2A93C', '#4C8FE2', '#3FB27F', '#E2574C', '#E8BE6B', '#5AC8C8', '#D66FA8'] as const;

export function chartColorForIndex(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
