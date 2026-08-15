import { describe, expect, it } from 'vitest';

import { buildDedupeKey } from './dedupe';

describe('buildDedupeKey', () => {
  const base = { sourceId: 'src-mvola', reference: 'MV1', amount: 1000, occurredAt: '2026-08-15T10:00:00.000Z', type: 'income' };

  it('produces the same key for identical inputs', () => {
    expect(buildDedupeKey(base)).toBe(buildDedupeKey({ ...base }));
  });

  it('changes when the amount differs', () => {
    expect(buildDedupeKey(base)).not.toBe(buildDedupeKey({ ...base, amount: 2000 }));
  });

  it('changes when the reference differs', () => {
    expect(buildDedupeKey(base)).not.toBe(buildDedupeKey({ ...base, reference: 'MV2' }));
  });

  it('is stable across same-day time-of-day differences (day-level granularity)', () => {
    expect(buildDedupeKey(base)).toBe(buildDedupeKey({ ...base, occurredAt: '2026-08-15T23:59:59.000Z' }));
  });

  it('changes across different days', () => {
    expect(buildDedupeKey(base)).not.toBe(buildDedupeKey({ ...base, occurredAt: '2026-08-16T10:00:00.000Z' }));
  });
});
