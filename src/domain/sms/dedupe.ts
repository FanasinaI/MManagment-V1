/**
 * CDC §7 anti-doublon. The canonical key builder is pure and synchronous so
 * it can be unit-tested without any native crypto module. The actual digest
 * (SHA-256 via expo-crypto in the app) is produced by an injected `hashFn` —
 * see PipelineDeps in pipeline.ts.
 */
export function buildDedupeKey(input: {
  sourceId: string;
  reference?: string;
  amount: number;
  occurredAt: string;
  type: string;
}): string {
  const day = input.occurredAt.slice(0, 10);
  return `${input.sourceId}|${input.reference ?? ''}|${input.amount}|${day}|${input.type}`;
}
