import { generateId } from '@/utils/id';
import { nowIso } from '@/utils/date';

import type { DbConnection } from '../types';

export type SmsEventStatus =
  | 'ignored_not_allowed'
  | 'ignored_no_structure'
  | 'parsed_pending'
  | 'confirmed'
  | 'duplicate'
  | 'rejected'
  | 'no_matching_account';

export interface SmsEvent {
  id: string;
  sourceId: string | null;
  receivedAt: string;
  hash: string | null;
  status: SmsEventStatus;
}

/**
 * CDC §6: a technical log with no message content by default. `diagnosticContent`
 * (migration 002) is only ever populated by the caller when the user has
 * explicitly enabled diagnostic mode — this repository never assumes that.
 */
export function createSmsEventsRepository(db: DbConnection) {
  return {
    async log(input: { sourceId: string | null; hash: string | null; status: SmsEventStatus; diagnosticContent?: string }): Promise<SmsEvent> {
      const id = generateId();
      const receivedAt = nowIso();
      await db.runAsync(
        'INSERT INTO sms_events (id, sourceId, receivedAt, hash, status, diagnosticContent) VALUES (?, ?, ?, ?, ?, ?);',
        [id, input.sourceId, receivedAt, input.hash, input.status, input.diagnosticContent ?? null]
      );
      return { id, sourceId: input.sourceId, receivedAt, hash: input.hash, status: input.status };
    },

    async list(limit = 100): Promise<SmsEvent[]> {
      return db.getAllAsync<SmsEvent>('SELECT id, sourceId, receivedAt, hash, status FROM sms_events ORDER BY receivedAt DESC LIMIT ?;', [
        limit,
      ]);
    },

    /** How many messages from this source successfully parsed into a transaction — the CDC §8 "reliable rules" signal. */
    async countSuccessfulForSource(sourceId: string): Promise<number> {
      const row = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sms_events WHERE sourceId = ? AND status IN ('parsed_pending', 'confirmed');",
        [sourceId]
      );
      return row?.count ?? 0;
    },
  };
}

export type SmsEventsRepository = ReturnType<typeof createSmsEventsRepository>;
