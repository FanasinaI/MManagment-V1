import { describe, expect, it } from 'vitest';

import { advanceOccurrence, computeDueOccurrences } from './recurrence';

describe('advanceOccurrence', () => {
  it('adds 7 days for weekly', () => {
    expect(advanceOccurrence(new Date('2026-08-01T09:00:00.000Z'), 'weekly').toISOString()).toBe('2026-08-08T09:00:00.000Z');
  });

  it('adds 1 month for monthly', () => {
    expect(advanceOccurrence(new Date('2026-08-05T09:00:00.000Z'), 'monthly').toISOString()).toBe('2026-09-05T09:00:00.000Z');
  });

  it('adds 1 year for yearly', () => {
    expect(advanceOccurrence(new Date('2026-08-05T09:00:00.000Z'), 'yearly').toISOString()).toBe('2027-08-05T09:00:00.000Z');
  });
});

describe('computeDueOccurrences', () => {
  it('returns nothing when the next occurrence is in the future', () => {
    const now = new Date('2026-08-01T00:00:00.000Z');
    const result = computeDueOccurrences('2026-09-01T00:00:00.000Z', 'monthly', now);
    expect(result).toEqual([]);
  });

  it('returns one occurrence when exactly one period has elapsed', () => {
    const now = new Date('2026-08-10T00:00:00.000Z');
    const result = computeDueOccurrences('2026-08-05T00:00:00.000Z', 'monthly', now);
    expect(result).toHaveLength(1);
    expect(result[0].occurredAt).toBe('2026-08-05T00:00:00.000Z');
    expect(result[0].nextOccurrence).toBe('2026-09-05T00:00:00.000Z');
  });

  it('catches up on multiple missed periods, chaining nextOccurrence forward', () => {
    const now = new Date('2026-08-15T00:00:00.000Z');
    const result = computeDueOccurrences('2026-06-01T00:00:00.000Z', 'monthly', now);
    expect(result.map((d) => d.occurredAt)).toEqual([
      '2026-06-01T00:00:00.000Z',
      '2026-07-01T00:00:00.000Z',
      '2026-08-01T00:00:00.000Z',
    ]);
    expect(result[result.length - 1].nextOccurrence).toBe('2026-09-01T00:00:00.000Z');
  });

  it('caps catch-up at maxCatchUp to avoid an unbounded backlog', () => {
    const now = new Date('2030-01-01T00:00:00.000Z');
    const result = computeDueOccurrences('2020-01-01T00:00:00.000Z', 'weekly', now, 5);
    expect(result).toHaveLength(5);
  });
});
