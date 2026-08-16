import { generateId } from '@/utils/id';
import type { NewSmsSource, SmsSourceRecord } from '@/validation/smsSourceSchema';

import type { DbConnection } from '../types';

interface SmsSourceRow {
  id: string;
  name: string;
  provider: string;
  senderPattern: string;
  enabled: number;
  parserVersion: string;
  autoConfirm: number;
}

function toSmsSource(row: SmsSourceRow): SmsSourceRecord {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider as SmsSourceRecord['provider'],
    senderPattern: row.senderPattern,
    enabled: row.enabled === 1,
    parserVersion: row.parserVersion,
    autoConfirm: row.autoConfirm === 1,
  };
}

export function createSmsSourcesRepository(db: DbConnection) {
  return {
    async list(): Promise<SmsSourceRecord[]> {
      const rows = await db.getAllAsync<SmsSourceRow>('SELECT * FROM sms_sources ORDER BY name ASC;');
      return rows.map(toSmsSource);
    },

    async listEnabled(): Promise<SmsSourceRecord[]> {
      const rows = await db.getAllAsync<SmsSourceRow>('SELECT * FROM sms_sources WHERE enabled = 1;');
      return rows.map(toSmsSource);
    },

    async create(input: NewSmsSource): Promise<SmsSourceRecord> {
      const id = generateId();
      const parserVersion = 'v1';
      await db.runAsync(
        'INSERT INTO sms_sources (id, name, senderPattern, enabled, parserVersion, provider, autoConfirm) VALUES (?, ?, ?, ?, ?, ?, 0);',
        [id, input.name, input.senderPattern, input.enabled ? 1 : 0, parserVersion, input.provider]
      );
      return {
        id,
        name: input.name,
        provider: input.provider,
        senderPattern: input.senderPattern,
        enabled: input.enabled,
        parserVersion,
        autoConfirm: false,
      };
    },

    async setEnabled(id: string, enabled: boolean): Promise<void> {
      await db.runAsync('UPDATE sms_sources SET enabled = ? WHERE id = ?;', [enabled ? 1 : 0, id]);
    },

    async setAutoConfirm(id: string, autoConfirm: boolean): Promise<void> {
      await db.runAsync('UPDATE sms_sources SET autoConfirm = ? WHERE id = ?;', [autoConfirm ? 1 : 0, id]);
    },

    async remove(id: string): Promise<void> {
      await db.runAsync('DELETE FROM sms_sources WHERE id = ?;', [id]);
    },
  };
}

export type SmsSourcesRepository = ReturnType<typeof createSmsSourcesRepository>;
