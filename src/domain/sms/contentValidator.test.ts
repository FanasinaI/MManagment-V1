import { describe, expect, it } from 'vitest';

import { detectFinancialMarkers, hasMinimumStructure } from './contentValidator';

describe('contentValidator', () => {
  it('recognizes a well-formed transaction message', () => {
    const markers = detectFinancialMarkers('Vous avez recu 100000 Ar de la part de 034 12 345 67. ID Transaction: MV1');
    expect(hasMinimumStructure(markers)).toBe(true);
  });

  it('rejects a promotional message with no amount/currency/verb', () => {
    const markers = detectFinancialMarkers('MVola vous offre 10% de bonus sur vos recharges ce mois-ci !');
    expect(hasMinimumStructure(markers)).toBe(false);
  });

  it('rejects a message with an amount but no currency token', () => {
    const markers = detectFinancialMarkers('Vous avez recu 100000 de la part de 034 12 345 67.');
    expect(hasMinimumStructure(markers)).toBe(false);
  });

  it('treats the reference marker as optional', () => {
    const markers = detectFinancialMarkers('Vous avez recu 100000 Ar de la part de 034 12 345 67.');
    expect(markers.hasReference).toBe(false);
    expect(hasMinimumStructure(markers)).toBe(true);
  });
});
