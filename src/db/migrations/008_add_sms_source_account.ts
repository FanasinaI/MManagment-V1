import type { Migration } from '../migrationRunner';

/**
 * `sms_sources` (CDC §11) has no way to say which account a source's
 * transactions belong to — with one account per provider that's implicit
 * (match on provider), but it breaks down with e.g. two MVola accounts.
 * This lets the user pin a source to a specific account explicitly; NULL
 * keeps the old provider-matching fallback (see smsListenerService.ts).
 */
export const migration008AddSmsSourceAccount: Migration = {
  version: 8,
  name: 'add_sms_source_account',
  up: async (db) => {
    await db.execAsync(`ALTER TABLE sms_sources ADD COLUMN accountId TEXT REFERENCES accounts(id) ON DELETE SET NULL;`);
  },
};
