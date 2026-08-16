import type { Migration } from '../migrationRunner';

/**
 * CDC §3: MVola, Airtel Money and Orange Money are "autorisé par défaut".
 * We can't know the exact real sender id shown on a given phone/carrier, so
 * these are seeded with a best-guess `senderPattern` (the provider's common
 * display name) that the user can correct in Settings > Sources SMS to
 * match what actually shows up in their SMS app — the point is that the
 * rows exist and are enabled by default, not that the pattern is perfect
 * out of the box. Fixed ids (not random) since this only ever runs once.
 */
export const migration004SeedDefaultSmsSources: Migration = {
  version: 4,
  name: 'seed_default_sms_sources',
  up: async (db) => {
    const defaults: { id: string; name: string; senderPattern: string; provider: string }[] = [
      { id: 'default-mvola', name: 'MVola', senderPattern: 'MVola', provider: 'mvola' },
      { id: 'default-airtel-money', name: 'Airtel Money', senderPattern: 'AirtelMoney', provider: 'airtel_money' },
      { id: 'default-orange-money', name: 'Orange Money', senderPattern: 'OrangeMoney', provider: 'orange_money' },
    ];

    for (const source of defaults) {
      await db.runAsync(
        `INSERT INTO sms_sources (id, name, senderPattern, enabled, parserVersion, provider) VALUES (?, ?, ?, 1, 'v1', ?);`,
        [source.id, source.name, source.senderPattern, source.provider]
      );
    }
  },
};
