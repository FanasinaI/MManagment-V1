import { describe, expect, it } from 'vitest';

import { buildBackupPayload, exportEncryptedBackup, type BackupSource } from './exportBackup';
import { importEncryptedBackup, InvalidBackupError } from './importBackup';

const emptySource: BackupSource = {
  getAccounts: async () => [
    { id: 'a1', name: 'MVola', provider: 'mvola', type: 'mobile_money', currency: 'MGA', balance: 100000, sortOrder: 0, isDefault: true },
  ],
  getTransactions: async () => [],
  getCategories: async () => [{ id: 'c1', name: 'Alimentation', icon: null }],
  getBudgets: async () => [],
  getSavings: async () => [],
  getGoals: async () => [],
  getSmsSources: async () => [],
  getAlerts: async () => [],
};

const identityEncrypt = async (json: string) => json;
const identityDecrypt = async (ciphertext: string) => ciphertext;

describe('backup export/import round trip', () => {
  it('builds a payload with the expected top-level shape', async () => {
    const payload = await buildBackupPayload(emptySource);
    expect(payload.version).toBe(1);
    expect(payload.accounts).toHaveLength(1);
    expect(typeof payload.exportedAt).toBe('string');
  });

  it('round-trips through export then import unchanged', async () => {
    const ciphertext = await exportEncryptedBackup(emptySource, identityEncrypt);
    const restored = await importEncryptedBackup(ciphertext, identityDecrypt);
    expect(restored.accounts).toEqual(await emptySource.getAccounts());
    expect(restored.categories).toEqual(await emptySource.getCategories());
  });

  it('rejects a payload that fails schema validation', async () => {
    const badJson = JSON.stringify({ version: 1, exportedAt: 'now', accounts: [{ missing: 'fields' }] });
    await expect(importEncryptedBackup(badJson, identityDecrypt)).rejects.toBeInstanceOf(InvalidBackupError);
  });

  it('rejects content that is not valid JSON (simulating a wrong decryption key)', async () => {
    await expect(importEncryptedBackup('not-json-and-not-encrypted', identityDecrypt)).rejects.toBeInstanceOf(
      InvalidBackupError
    );
  });
});
