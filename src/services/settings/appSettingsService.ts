import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark';

const KEYS = {
  smsDetectionEnabled: 'mm_sms_detection_enabled',
  smsDiagnosticsEnabled: 'mm_sms_diagnostics_enabled',
  themeMode: 'mm_theme_mode',
  username: 'mm_username',
  onboardingCompleted: 'mm_onboarding_completed',
} as const;

async function getBool(key: string, defaultValue: boolean): Promise<boolean> {
  const value = await SecureStore.getItemAsync(key);
  return value === null ? defaultValue : value === '1';
}

async function setBool(key: string, value: boolean): Promise<void> {
  await SecureStore.setItemAsync(key, value ? '1' : '0');
}

/** Small app-level flags. CDC §3 defaults SMS detection to ON; §6 defaults diagnostics to OFF. */
export const appSettingsService = {
  isSmsDetectionEnabled: () => getBool(KEYS.smsDetectionEnabled, true),
  setSmsDetectionEnabled: (value: boolean) => setBool(KEYS.smsDetectionEnabled, value),
  isSmsDiagnosticsEnabled: () => getBool(KEYS.smsDiagnosticsEnabled, false),
  setSmsDiagnosticsEnabled: (value: boolean) => setBool(KEYS.smsDiagnosticsEnabled, value),

  async getThemeMode(): Promise<ThemeMode> {
    const value = await SecureStore.getItemAsync(KEYS.themeMode);
    return value === 'light' ? 'light' : 'dark';
  },
  async setThemeMode(mode: ThemeMode): Promise<void> {
    await SecureStore.setItemAsync(KEYS.themeMode, mode);
  },

  async getUsername(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.username);
  },
  async setUsername(username: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.username, username);
  },

  isOnboardingCompleted: () => getBool(KEYS.onboardingCompleted, false),
  setOnboardingCompleted: (value: boolean) => setBool(KEYS.onboardingCompleted, value),
};
