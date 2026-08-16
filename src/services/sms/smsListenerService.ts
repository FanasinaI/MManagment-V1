import * as Crypto from 'expo-crypto';

import { getRepositories } from '@/db/repositories';
import { UnavailableSmsReceiver, type SmsReceiver } from '@/domain/sms/nativeSmsReceiver';
import { processIncomingSms } from '@/domain/sms/pipeline';
import { appSettingsService } from '@/services/settings/appSettingsService';

import { AndroidSmsReceiver, isNativeSmsReceiverAvailable } from './androidSmsReceiver';

// Picks the real Android module (modules/sms-receiver) when it's actually
// linked — true only inside a Development Build rebuilt after that module
// was added — and falls back to the no-op stub everywhere else (Expo Go,
// web, or before that rebuild). No other file needs to change once the
// native module works; this is the one place that selects between them.
const receiver: SmsReceiver = isNativeSmsReceiverAvailable() ? new AndroidSmsReceiver() : new UnavailableSmsReceiver();

let unsubscribe: (() => void) | null = null;

export const smsListenerService = {
  getReceiver(): SmsReceiver {
    return receiver;
  },

  /** Idempotent: subscribes once per app session, no-ops if permission isn't granted. */
  async start(): Promise<void> {
    if (unsubscribe) return;
    const granted = await receiver.isPermissionGranted();
    if (!granted) return;

    unsubscribe = receiver.subscribe((msg) => {
      void processMessage(msg);
    });
  },

  stop(): void {
    unsubscribe?.();
    unsubscribe = null;
  },
};

async function processMessage(msg: { sender: string; body: string; receivedAt: string }): Promise<void> {
  const [{ smsSources, smsEvents, transactions, accounts }, detectionEnabled] = await Promise.all([
    getRepositories(),
    appSettingsService.isSmsDetectionEnabled(),
  ]);
  const sources = await smsSources.listEnabled();

  const outcome = await processIncomingSms(msg, sources, detectionEnabled, {
    hashFn: (canonical) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical),
    isDuplicate: async (hash) => (await transactions.findByHash(hash)) !== null,
  });

  switch (outcome.kind) {
    case 'sms_detection_disabled':
      return;

    case 'ignored_not_allowed':
      await smsEvents.log({ sourceId: null, hash: null, status: 'ignored_not_allowed' });
      return;

    case 'ignored_no_structure':
      await smsEvents.log({ sourceId: outcome.sourceId, hash: null, status: 'ignored_no_structure' });
      return;

    case 'duplicate':
      await smsEvents.log({ sourceId: outcome.sourceId, hash: outcome.hash, status: 'duplicate' });
      return;

    case 'pending_transaction': {
      // CDC §11's sms_sources table has no accountId column, so the target
      // account is resolved by matching provider (e.g. the single MVola
      // account for a source with provider "mvola"). If several accounts
      // share a provider, the first match wins — acceptable for the common
      // one-account-per-provider case; revisit if that stops holding.
      const source = sources.find((candidate) => candidate.id === outcome.sourceId);
      const allAccounts = await accounts.list();
      const targetAccount = source ? allAccounts.find((account) => account.provider === source.provider) : undefined;

      if (!targetAccount) {
        await smsEvents.log({ sourceId: outcome.sourceId, hash: outcome.hash, status: 'no_matching_account' });
        return;
      }

      const created = await transactions.createPendingFromSms({
        accountId: targetAccount.id,
        type: outcome.draft.type,
        amount: outcome.draft.amount,
        occurredAt: outcome.draft.occurredAt,
        hash: outcome.hash,
      });

      // CDC §8: auto-validation is an explicit per-source preference, only
      // ever offered in Settings once that source has proven reliable — see
      // app/(tabs)/settings/sms-sources/index.tsx.
      if (source?.autoConfirm) {
        await transactions.confirm(created.id);
        await smsEvents.log({ sourceId: outcome.sourceId, hash: outcome.hash, status: 'confirmed' });
      } else {
        await smsEvents.log({ sourceId: outcome.sourceId, hash: outcome.hash, status: 'parsed_pending' });
      }
      return;
    }
  }
}
