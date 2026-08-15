import type { Migration } from '../migrationRunner';

/**
 * CDC §6 opt-in exception: a diagnostic column that stays NULL unless the
 * user explicitly enables diagnostic mode in Settings. Also demonstrates the
 * versioning mechanism itself (an additive migration on top of 001_init).
 */
export const migration002AddSmsDiagnostics: Migration = {
  version: 2,
  name: 'add_sms_diagnostics',
  up: async (db) => {
    await db.execAsync(`
      ALTER TABLE sms_events ADD COLUMN diagnosticContent TEXT;
    `);
  },
};
