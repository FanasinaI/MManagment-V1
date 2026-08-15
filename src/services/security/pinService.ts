import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_HASH_KEY = 'mm_pin_hash';

function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export const pinService = {
  async hasPin(): Promise<boolean> {
    return (await SecureStore.getItemAsync(PIN_HASH_KEY)) !== null;
  },

  async setPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_HASH_KEY, await hashPin(pin));
  },

  async verifyPin(pin: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
    if (!stored) return false;
    return (await hashPin(pin)) === stored;
  },

  async clearPin(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  },
};
