import { backupPayloadSchema, type BackupPayload } from '@/validation/backupSchema';

export type DecryptFn = (ciphertext: string) => Promise<string>;

export class InvalidBackupError extends Error {
  constructor(cause: unknown) {
    super('Fichier de sauvegarde invalide ou corrompu.');
    this.name = 'InvalidBackupError';
    this.cause = cause;
  }
}

/**
 * CDC §16 restore path: decrypts a `.mmbak` file's contents and validates the
 * resulting JSON against `backupPayloadSchema` before any of it reaches
 * SQLite. Throws `InvalidBackupError` for anything that fails to decrypt,
 * parse, or validate — callers should surface that as a user-facing error,
 * never partially import.
 */
export async function importEncryptedBackup(ciphertext: string, decrypt: DecryptFn): Promise<BackupPayload> {
  let json: string;
  try {
    json = await decrypt(ciphertext);
  } catch (cause) {
    throw new InvalidBackupError(cause);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new InvalidBackupError(cause);
  }

  const result = backupPayloadSchema.safeParse(parsed);
  if (!result.success) {
    throw new InvalidBackupError(result.error);
  }
  return result.data;
}
