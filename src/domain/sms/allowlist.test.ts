import { describe, expect, it } from 'vitest';

import { findAllowedSource } from './allowlist';
import type { SmsSourceConfig } from './types';

const sources: SmsSourceConfig[] = [
  { id: 'src-mvola', name: 'MVola', provider: 'mvola', senderPattern: 'MVola', enabled: true, parserVersion: 'v1' },
  { id: 'src-bni', name: 'BNI', provider: 'bank', senderPattern: 'BNI', enabled: false, parserVersion: 'v1' },
];

describe('findAllowedSource', () => {
  it('matches an enabled source case-insensitively', () => {
    expect(findAllowedSource('mvola', sources)?.id).toBe('src-mvola');
  });

  it('returns null for a disabled source even if the sender matches', () => {
    expect(findAllowedSource('BNI', sources)).toBeNull();
  });

  it('returns null for a personal contact or unrelated sender', () => {
    expect(findAllowedSource('+261340000000', sources)).toBeNull();
    expect(findAllowedSource('WhatsApp', sources)).toBeNull();
  });

  it('requires an exact match, not a substring', () => {
    expect(findAllowedSource('MVola Promo', sources)).toBeNull();
  });
});
