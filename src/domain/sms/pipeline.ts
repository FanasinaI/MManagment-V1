import { findAllowedSource } from './allowlist';
import { detectFinancialMarkers, hasMinimumStructure } from './contentValidator';
import { buildDedupeKey } from './dedupe';
import { getParserFor } from './parsers';
import type { PipelineOutcome, RawSmsMessage, SmsSourceConfig } from './types';

export interface PipelineDeps {
  /** e.g. Crypto.digestStringAsync(SHA256, ...) in the app; identity/node crypto in tests. */
  hashFn: (canonical: string) => Promise<string> | string;
  /** e.g. a transactions.hash lookup in the app; an in-memory Set in tests. */
  isDuplicate: (hash: string) => Promise<boolean> | boolean;
}

/**
 * CDC §3/§5/§7/§8 orchestration, zero RN/Expo imports: allowlist gate →
 * structural content validation → parser dispatch → dedupe → outcome. This
 * is the single function `smsListenerService.ts` calls for every incoming
 * SMS (real or test fixture).
 */
export async function processIncomingSms(
  msg: RawSmsMessage,
  sources: SmsSourceConfig[],
  smsDetectionEnabled: boolean,
  deps: PipelineDeps
): Promise<PipelineOutcome> {
  if (!smsDetectionEnabled) return { kind: 'sms_detection_disabled' };

  const source = findAllowedSource(msg.sender, sources);
  if (!source) return { kind: 'ignored_not_allowed' };

  const markers = detectFinancialMarkers(msg.body);
  if (!hasMinimumStructure(markers)) return { kind: 'ignored_no_structure', sourceId: source.id };

  const draft = getParserFor(source).parse(msg, source);
  if (!draft) return { kind: 'ignored_no_structure', sourceId: source.id };

  const canonical = buildDedupeKey({
    sourceId: source.id,
    reference: draft.reference,
    amount: draft.amount,
    occurredAt: draft.occurredAt,
    type: draft.type,
  });
  const hash = await deps.hashFn(canonical);

  if (await deps.isDuplicate(hash)) {
    return { kind: 'duplicate', hash, sourceId: source.id };
  }

  return { kind: 'pending_transaction', draft, hash, sourceId: source.id };
}
