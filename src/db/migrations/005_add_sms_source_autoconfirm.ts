import type { Migration } from '../migrationRunner';

/**
 * CDC §8: "Le système peut proposer l'auto-validation uniquement après
 * plusieurs règles fiables et une préférence explicite." This column is
 * that explicit per-source preference; the "several reliable rules" part is
 * enforced in the UI (only offered once a source has a handful of manually
 * confirmed transactions) rather than in the schema.
 */
export const migration005AddSmsSourceAutoConfirm: Migration = {
  version: 5,
  name: 'add_sms_source_autoconfirm',
  up: async (db) => {
    await db.execAsync(`ALTER TABLE sms_sources ADD COLUMN autoConfirm INTEGER NOT NULL DEFAULT 0;`);
  },
};
