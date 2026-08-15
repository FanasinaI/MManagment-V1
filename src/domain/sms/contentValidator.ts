import type { FinancialMarkers } from './types';

const AMOUNT_NEAR_CURRENCY_REGEX = /\d[\d\s.,]*\d|\d(?=\s?(?:Ar\b|Ariary|MGA))/i;
const CURRENCY_REGEX = /\b(Ar|Ariary|MGA)\b/i;
const REFERENCE_REGEX = /\b(?:r[ée]f(?:erence)?|id transaction|transaction id|id)[:\s#]*[A-Za-z0-9-]{4,}/i;

// Deliberately broad and French-centric (Madagascar mobile money wording).
// CDC roadmap flags these patterns for refinement once real captured SMS are
// available — see P6 in CLAUDE.md.
const OPERATION_VERBS = [
  'recu',
  'reçu',
  'envoye',
  'envoyé',
  'retrait',
  'depot',
  'dépôt',
  'paiement',
  'achat',
  'transfert',
  'rechargement',
  'frais',
];

/**
 * CDC §5 "double filtrage": extracts structural markers from the message
 * body. Used to reject promotional messages from an otherwise-authorized
 * sender before a parser is ever invoked.
 */
export function detectFinancialMarkers(body: string): FinancialMarkers {
  const lower = body.toLowerCase();
  return {
    hasAmount: AMOUNT_NEAR_CURRENCY_REGEX.test(body),
    hasCurrency: CURRENCY_REGEX.test(body),
    hasOperationVerb: OPERATION_VERBS.some((verb) => lower.includes(verb)),
    hasReference: REFERENCE_REGEX.test(body),
  };
}

/** Amount + currency + an operation verb are required; a reference is optional. */
export function hasMinimumStructure(markers: FinancialMarkers): boolean {
  return markers.hasAmount && markers.hasCurrency && markers.hasOperationVerb;
}
