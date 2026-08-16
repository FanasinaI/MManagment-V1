import { beforeEach, describe, expect, it } from 'vitest';

import { processIncomingSms, type PipelineDeps } from './pipeline';
import type { RawSmsMessage, SmsSourceConfig } from './types';

/** Deterministic stand-in for Crypto.digestStringAsync — good enough for dedupe-branch tests. */
function fakeHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return hash.toString(16);
}

const sources: SmsSourceConfig[] = [
  { id: 'src-mvola', name: 'MVola', provider: 'mvola', senderPattern: 'MVola', enabled: true, parserVersion: 'v1' },
  {
    id: 'src-airtel',
    name: 'Airtel Money',
    provider: 'airtel_money',
    senderPattern: 'AirtelMoney',
    enabled: true,
    parserVersion: 'v1',
  },
  {
    id: 'src-orange',
    name: 'Orange Money',
    provider: 'orange_money',
    senderPattern: 'OrangeMoney',
    enabled: true,
    parserVersion: 'v1',
  },
  { id: 'src-bni', name: 'BNI', provider: 'bank', senderPattern: 'BNI', enabled: true, parserVersion: 'v1' },
];

function msg(sender: string, body: string): RawSmsMessage {
  return { sender, body, receivedAt: '2026-08-15T10:00:00.000Z' };
}

function createDeps(): PipelineDeps & { seenHashes: Set<string> } {
  const seenHashes = new Set<string>();
  return {
    seenHashes,
    hashFn: (canonical) => fakeHash(canonical),
    isDuplicate: (hash) => seenHashes.has(hash),
  };
}

describe('processIncomingSms', () => {
  let deps: ReturnType<typeof createDeps>;

  beforeEach(() => {
    deps = createDeps();
  });

  it('ignores a message from an unauthorized sender without inspecting content', async () => {
    const outcome = await processIncomingSms(msg('+261340000000', 'Salut, tu es dispo ce soir ?'), sources, true, deps);
    expect(outcome).toEqual({ kind: 'ignored_not_allowed' });
  });

  it('ignores a promotional message from an authorized sender lacking transaction structure', async () => {
    const outcome = await processIncomingSms(
      msg('MVola', 'MVola vous offre 10% de bonus sur vos recharges ce mois-ci ! Profitez-en vite.'),
      sources,
      true,
      deps
    );
    expect(outcome).toEqual({ kind: 'ignored_no_structure', sourceId: 'src-mvola' });
  });

  it('parses a valid MVola receipt into a pending transaction', async () => {
    const outcome = await processIncomingSms(
      msg(
        'MVola',
        'Vous avez recu 100000 Ar de la part de 034 12 345 67. Nouveau solde: 150000 Ar. ID Transaction: MV12345678'
      ),
      sources,
      true,
      deps
    );
    expect(outcome.kind).toBe('pending_transaction');
    if (outcome.kind === 'pending_transaction') {
      expect(outcome.draft).toMatchObject({
        amount: 100000,
        type: 'income',
        currency: 'MGA',
        reference: 'MV12345678',
        reportedBalance: 150000,
      });
      expect(outcome.sourceId).toBe('src-mvola');
    }
  });

  it('parses a valid Airtel Money receipt into a pending transaction', async () => {
    const outcome = await processIncomingSms(
      msg('AirtelMoney', 'Vous avez recu 50000 Ar de 033 98 765 43. Solde: 80000 Ar. Ref: AM998877'),
      sources,
      true,
      deps
    );
    expect(outcome.kind).toBe('pending_transaction');
    if (outcome.kind === 'pending_transaction') {
      expect(outcome.draft).toMatchObject({ amount: 50000, type: 'income', reportedBalance: 80000 });
    }
  });

  it('parses a valid Orange Money debit into a pending transaction', async () => {
    const outcome = await processIncomingSms(
      msg('OrangeMoney', 'Vous avez envoye 20000 Ar a 032 11 222 33. Nouveau solde: 60000 Ar. ID Transaction: OM445566'),
      sources,
      true,
      deps
    );
    expect(outcome.kind).toBe('pending_transaction');
    if (outcome.kind === 'pending_transaction') {
      expect(outcome.draft).toMatchObject({ amount: 20000, type: 'expense', reportedBalance: 60000 });
    }
  });

  it('parses a valid bank transfer into a pending transaction', async () => {
    const outcome = await processIncomingSms(
      msg('BNI', 'Virement recu de 500000 Ar sur votre compte. Ref: BNI2026081501'),
      sources,
      true,
      deps
    );
    expect(outcome.kind).toBe('pending_transaction');
    if (outcome.kind === 'pending_transaction') {
      expect(outcome.draft).toMatchObject({ amount: 500000, type: 'income', reference: 'BNI2026081501' });
    }
  });

  it('flags the same message processed twice as a duplicate on the second pass', async () => {
    const sms = msg('MVola', 'Vous avez recu 100000 Ar de la part de 034 12 345 67. ID Transaction: MV12345678');

    const first = await processIncomingSms(sms, sources, true, deps);
    expect(first.kind).toBe('pending_transaction');
    if (first.kind === 'pending_transaction') deps.seenHashes.add(first.hash);

    const second = await processIncomingSms(sms, sources, true, deps);
    expect(second.kind).toBe('duplicate');
  });

  it('short-circuits everything when SMS detection is globally disabled', async () => {
    const outcome = await processIncomingSms(
      msg('MVola', 'Vous avez recu 100000 Ar de la part de 034 12 345 67. ID Transaction: MV12345678'),
      sources,
      false,
      deps
    );
    expect(outcome).toEqual({ kind: 'sms_detection_disabled' });
  });
});
