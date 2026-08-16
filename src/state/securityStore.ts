import { create } from 'zustand';

import { appSettingsService } from '@/services/settings/appSettingsService';
import { biometricService } from '@/services/security/biometricService';
import { pinService } from '@/services/security/pinService';

interface SecurityState {
  hasPin: boolean;
  isUnlocked: boolean;
  biometricAvailable: boolean;
  username: string | null;
  checkStatus: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lock: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  hasPin: false,
  isUnlocked: false,
  biometricAvailable: false,
  username: null,

  async checkStatus() {
    const [hasPin, biometricAvailable, username] = await Promise.all([
      pinService.hasPin(),
      biometricService.isAvailable(),
      appSettingsService.getUsername(),
    ]);
    set({ hasPin, biometricAvailable, username, isUnlocked: !hasPin });
  },

  async setPin(pin) {
    await pinService.setPin(pin);
    set({ hasPin: true, isUnlocked: true });
  },

  async setUsername(username) {
    await appSettingsService.setUsername(username);
    set({ username });
  },

  async unlockWithPin(pin) {
    const ok = await pinService.verifyPin(pin);
    if (ok) set({ isUnlocked: true });
    return ok;
  },

  async unlockWithBiometrics() {
    const ok = await biometricService.authenticate();
    if (ok) set({ isUnlocked: true });
    return ok;
  },

  lock() {
    if (get().hasPin) set({ isUnlocked: false });
  },
}));
