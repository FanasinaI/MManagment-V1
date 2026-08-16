/** Percentage change from `previous` to `current`. Null when `previous` is 0 and `current` isn't (an undefined "% change" from nothing). */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
