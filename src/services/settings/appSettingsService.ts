import * as SecureStore from 'expo-secure-store';

const KEYS = {
  smsDetectionEnabled: 'mm_sms_detection_enabled',
  smsDiagnosticsEnabled: 'mm_sms_diagnostics_enabled',
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
};
