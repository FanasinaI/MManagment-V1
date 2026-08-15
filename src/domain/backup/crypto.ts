import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';

/**
 * AES-GCM adapter backing exportBackup/importBackup's `encrypt`/`decrypt`
 * dependencies. This file talks to the native expo-crypto module directly,
 * so — like db/client.ts — it is not unit-testable under plain Node/Vitest;
 * the pure orchestration it's injected into (exportBackup.ts/importBackup.ts)
 * is tested instead, with an identity function standing in for this adapter.
 */

function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Generates a new 256-bit backup key, hex-encoded for storage in expo-secure-store. */
export async function generateBackupKeyHex(): Promise<string> {
  const key = await AESEncryptionKey.generate(256);
  return key.encoded('hex');
}

export async function encryptJson(json: string, keyHex: string): Promise<string> {
  const key = await AESEncryptionKey.import(keyHex, 'hex');
  const sealed = await aesEncryptAsync(utf8ToBase64(json), key);
  return sealed.combined('base64');
}

export async function decryptJson(combinedBase64: string, keyHex: string): Promise<string> {
  const key = await AESEncryptionKey.import(keyHex, 'hex');
  const sealed = AESSealedData.fromCombined(combinedBase64);
  const plaintextBase64 = await aesDecryptAsync(sealed, key, { output: 'base64' });
  return base64ToUtf8(plaintextBase64 as string);
}
