import type { SmsSourceConfig } from './types';

function normalizeSender(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * CDC §3: only an explicitly authorized, enabled sender may proceed past this
 * gate. Match is exact (normalized for case/whitespace) — "autoriser
 * uniquement l'expéditeur exact" applies uniformly, not just to banks.
 * Returns null immediately for anything else; callers must not inspect the
 * message body when this returns null.
 */
export function findAllowedSource(sender: string, sources: SmsSourceConfig[]): SmsSourceConfig | null {
  const normalizedSender = normalizeSender(sender);
  return sources.find((source) => source.enabled && normalizeSender(source.senderPattern) === normalizedSender) ?? null;
}
