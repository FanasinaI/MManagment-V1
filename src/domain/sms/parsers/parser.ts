import type { ParsedTransactionDraft, RawSmsMessage, SmsSourceConfig, TransactionType } from '../types';

export interface Parser {
  /** Returns null if the body doesn't contain a recognizable transaction for this provider. */
  parse(msg: RawSmsMessage, source: SmsSourceConfig): ParsedTransactionDraft | null;
}

/**
 * Strips everything but digits from the number immediately preceding/near a
 * currency token, treating spaces/commas/dots as thousand separators — Ariary
 * amounts are conventionally whole numbers (no decimals). Refine against real
 * captured SMS per the CDC P6 roadmap note.
 */
export function extractAmount(body: string): number | null {
  const match = body.match(/([\d][\d\s.,]*\d|\d)\s?(?:Ar\b|Ariary|MGA)/i);
  if (!match) return null;
  const digitsOnly = match[1].replace(/\D/g, '');
  if (!digitsOnly) return null;
  const value = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(value) ? value : null;
}

export function extractReference(body: string): string | undefined {
  const match = body.match(/\b(?:r[ée]f(?:erence)?|id transaction|transaction id|id)[:\s#]*([A-Za-z0-9-]{4,})/i);
  return match?.[1];
}

/**
 * Distinct from extractAmount: a mobile money/bank SMS commonly reports the
 * *post-transaction* balance alongside the transaction amount itself (e.g.
 * "Nouveau solde: 150000 Ar"), and this pulls that number specifically —
 * looking for "solde" followed by up to a few words of filler ("actuel",
 * "disponible", ":", ...) before the figure, so it doesn't need an exact
 * phrase match. Returns null when the SMS never mentions a balance.
 */
export function extractReportedBalance(body: string): number | null {
  const match = body.match(/solde[^\d]{0,20}([\d][\d\s.,]*\d|\d)\s?(?:Ar\b|Ariary|MGA)/i);
  if (!match) return null;
  const digitsOnly = match[1].replace(/\D/g, '');
  if (!digitsOnly) return null;
  const value = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * Returns the transaction type for the first matching verb phrase. `verbMap`
 * keys are checked in insertion order, so put longer/more specific phrases
 * before shorter ones that could also match.
 */
export function matchOperationType(body: string, verbMap: Record<string, TransactionType>): TransactionType | null {
  const lower = body.toLowerCase();
  for (const [verb, type] of Object.entries(verbMap)) {
    if (lower.includes(verb)) return type;
  }
  return null;
}

/**
 * Shared verb vocabulary for MVola/Airtel Money/Orange Money — broadly
 * consistent French phrasing in Madagascar. Ordered most-specific-first:
 * a concrete action word (retrait/depot/...) beats the "raison: credit/
 * debit" direction marker, which beats the bare recu/envoye fallback.
 *
 * Confirmed against a real MVola receipt (2026-08-16): "1 000 Ar recu de
 * X ... Raison: Credit. Solde: 51 408 Ar." — no "avez" in front of
 * "recu", which is why that entry alone used to miss it entirely (it
 * passed contentValidator's looser check, then silently failed to parse).
 * Kept the "avez X" phrasing too in case another provider/format uses it.
 */
export const MOBILE_MONEY_VERB_MAP: Record<string, TransactionType> = {
  retrait: 'withdrawal',
  depot: 'deposit',
  dépôt: 'deposit',
  paiement: 'expense',
  achat: 'expense',
  frais: 'fee',
  'avez recu': 'income',
  'avez reçu': 'income',
  'avez envoye': 'expense',
  'avez envoyé': 'expense',
  'raison: credit': 'income',
  'raison : credit': 'income',
  'raison: debit': 'expense',
  'raison : debit': 'expense',
  recu: 'income',
  reçu: 'income',
  envoye: 'expense',
  envoyé: 'expense',
};
