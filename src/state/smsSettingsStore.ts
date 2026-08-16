import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { appSettingsService } from '@/services/settings/appSettingsService';
import { smsListenerService } from '@/services/sms/smsListenerService';
import { smsPermissionService } from '@/services/sms/smsPermissionService';
import type { NewSmsSource, SmsSourceRecord } from '@/validation/smsSourceSchema';

/** CDC §8: auto-validation is only offered once a source has this many successfully parsed messages. */
export const AUTO_CONFIRM_RELIABILITY_THRESHOLD = 3;

interface SmsSettingsState {
  detectionEnabled: boolean;
  permissionGranted: boolean;
  sources: SmsSourceRecord[];
  reliabilityCounts: Record<string, number>;
  loading: boolean;
  load: () => Promise<void>;
  setDetectionEnabled: (value: boolean) => Promise<void>;
  addSource: (input: NewSmsSource) => Promise<SmsSourceRecord>;
  setSourceEnabled: (id: string, enabled: boolean) => Promise<void>;
  setSourceAutoConfirm: (id: string, autoConfirm: boolean) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
}

export const useSmsSettingsStore = create<SmsSettingsState>((set, get) => ({
  detectionEnabled: true,
  permissionGranted: false,
  sources: [],
  reliabilityCounts: {},
  loading: false,

  async load() {
    set({ loading: true });
    const [{ smsSources, smsEvents }, detectionEnabled, permissionGranted] = await Promise.all([
      getRepositories(),
      appSettingsService.isSmsDetectionEnabled(),
      smsPermissionService.isGranted(),
    ]);
    const list = await smsSources.list();
    const counts = await Promise.all(list.map((source) => smsEvents.countSuccessfulForSource(source.id)));
    const reliabilityCounts = Object.fromEntries(list.map((source, i) => [source.id, counts[i]]));
    set({ sources: list, detectionEnabled, permissionGranted, reliabilityCounts, loading: false });
  },

  /**
   * The master toggle is the point where the Android permission prompt is
   * actually triggered — nothing requested it before this, which is why no
   * popup ever appeared. Starts/stops the native listener accordingly.
   */
  async setDetectionEnabled(value) {
    await appSettingsService.setSmsDetectionEnabled(value);
    set({ detectionEnabled: value });

    if (value) {
      const granted = await smsPermissionService.request();
      set({ permissionGranted: granted });
      if (granted) await smsListenerService.start();
    } else {
      smsListenerService.stop();
    }
  },

  async addSource(input) {
    const { smsSources } = await getRepositories();
    const created = await smsSources.create(input);
    set({ sources: [...get().sources, created] });
    return created;
  },

  async setSourceEnabled(id, enabled) {
    const { smsSources } = await getRepositories();
    await smsSources.setEnabled(id, enabled);
    set({ sources: get().sources.map((s) => (s.id === id ? { ...s, enabled } : s)) });
  },

  async setSourceAutoConfirm(id, autoConfirm) {
    const { smsSources } = await getRepositories();
    await smsSources.setAutoConfirm(id, autoConfirm);
    set({ sources: get().sources.map((s) => (s.id === id ? { ...s, autoConfirm } : s)) });
  },

  async removeSource(id) {
    const { smsSources } = await getRepositories();
    await smsSources.remove(id);
    set({ sources: get().sources.filter((s) => s.id !== id) });
  },
}));
