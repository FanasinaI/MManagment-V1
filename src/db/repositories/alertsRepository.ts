import { generateId } from '@/utils/id';
import type { Alert } from '@/validation/backupSchema';

import type { DbConnection } from '../types';

interface AlertRow {
  id: string;
  type: string;
  threshold: number | null;
  enabled: number;
}

function toAlert(row: AlertRow): Alert {
  return { id: row.id, type: row.type as Alert['type'], threshold: row.threshold, enabled: row.enabled === 1 };
}

export function createAlertsRepository(db: DbConnection) {
  return {
    async list(): Promise<Alert[]> {
      const rows = await db.getAllAsync<AlertRow>('SELECT * FROM alerts;');
      return rows.map(toAlert);
    },

    async upsert(input: { id?: string; type: Alert['type']; threshold?: number | null; enabled: boolean }): Promise<Alert> {
      const id = input.id ?? generateId();
      await db.runAsync(
        `INSERT INTO alerts (id, type, threshold, enabled) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET threshold = excluded.threshold, enabled = excluded.enabled;`,
        [id, input.type, input.threshold ?? null, input.enabled ? 1 : 0]
      );
      return { id, type: input.type, threshold: input.threshold ?? null, enabled: input.enabled };
    },

    async setEnabled(id: string, enabled: boolean): Promise<void> {
      await db.runAsync('UPDATE alerts SET enabled = ? WHERE id = ?;', [enabled ? 1 : 0, id]);
    },
  };
}

export type AlertsRepository = ReturnType<typeof createAlertsRepository>;
