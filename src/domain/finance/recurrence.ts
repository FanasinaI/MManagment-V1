export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';

export function advanceOccurrence(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

export interface DueOccurrence {
  occurredAt: string; // ISO — when this occurrence is due
  nextOccurrence: string; // ISO — what the rule's nextOccurrence becomes once this one is processed
}

/**
 * Computes every occurrence of a recurring rule due as of `now`. If the app
 * wasn't opened for a while, more than one occurrence can be due at once —
 * `maxCatchUp` bounds how many are generated in a single pass so a rule
 * left dormant for years doesn't produce an unbounded backlog.
 */
export function computeDueOccurrences(
  nextOccurrence: string,
  frequency: RecurrenceFrequency,
  now: Date,
  maxCatchUp = 12
): DueOccurrence[] {
  const due: DueOccurrence[] = [];
  let cursor = new Date(nextOccurrence);
  let iterations = 0;

  while (cursor.getTime() <= now.getTime() && iterations < maxCatchUp) {
    const occurredAt = cursor.toISOString();
    cursor = advanceOccurrence(cursor, frequency);
    due.push({ occurredAt, nextOccurrence: cursor.toISOString() });
    iterations++;
  }

  return due;
}
