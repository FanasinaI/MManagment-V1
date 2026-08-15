import { create } from 'zustand';

import { biometricService } from '@/services/security/biometricService';
import { pinService } from '@/services/security/pinService';

interface SecurityState {
  hasPin: boolean;
  isUnlocked: boolean;
  biometricAvailable: boolean;
  checkStatus: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lock: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  hasPin: false,
  isUnlocked: false,
  biometricAvailable: false,

  async checkStatus() {
    const [hasPin, biometricAvailable] = await Promise.all([pinService.hasPin(), biometricService.isAvailable()]);
    set({ hasPin, biometricAvailable, isUnlocked: !hasPin });
  },

  async setPin(pin) {
    await pinService.setPin(pin);
    set({ hasPin: true, isUnlocked: true });
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
