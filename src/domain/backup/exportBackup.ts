import { BACKUP_FORMAT_VERSION, type BackupPayload } from '@/validation/backupSchema';

export interface BackupSource {
  getAccounts(): Promise<BackupPayload['accounts']>;
  getTransactions(): Promise<BackupPayload['transactions']>;
  getCategories(): Promise<BackupPayload['categories']>;
  getBudgets(): Promise<BackupPayload['budgets']>;
  getSavings(): Promise<BackupPayload['savings']>;
  getGoals(): Promise<BackupPayload['goals']>;
  getSmsSources(): Promise<BackupPayload['smsSources']>;
  getAlerts(): Promise<BackupPayload['alerts']>;
}

export type EncryptFn = (json: string) => Promise<string>;

export async function buildBackupPayload(source: BackupSource): Promise<BackupPayload> {
  const [accounts, transactions, categories, budgets, savings, goals, smsSources, alerts] = await Promise.all([
    source.getAccounts(),
    source.getTransactions(),
    source.getCategories(),
    source.getBudgets(),
    source.getSavings(),
    source.getGoals(),
    source.getSmsSources(),
    source.getAlerts(),
  ]);

  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    accounts,
    transactions,
    categories,
    budgets,
    savings,
    goals,
    smsSources,
    alerts,
  };
}

/**
 * CDC §16: gathers all local data into a single JSON payload and encrypts it
 * via the injected `encrypt` function (expo-crypto AES-GCM in the app,
 * identity function in tests). Returns the ciphertext string to be written
 * to a `.mmbak` file by the caller.
 */
export async function exportEncryptedBackup(source: BackupSource, encrypt: EncryptFn): Promise<string> {
  const payload = await buildBackupPayload(source);
  return encrypt(JSON.stringify(payload));
}
