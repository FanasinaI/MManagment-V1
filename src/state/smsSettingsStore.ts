import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { appSettingsService } from '@/services/settings/appSettingsService';
import type { NewSmsSource, SmsSourceRecord } from '@/validation/smsSourceSchema';

interface SmsSettingsState {
  detectionEnabled: boolean;
  sources: SmsSourceRecord[];
  loading: boolean;
  load: () => Promise<void>;
  setDetectionEnabled: (value: boolean) => Promise<void>;
  addSource: (input: NewSmsSource) => Promise<SmsSourceRecord>;
  setSourceEnabled: (id: string, enabled: boolean) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
}

export const useSmsSettingsStore = create<SmsSettingsState>((set, get) => ({
  detectionEnabled: true,
  sources: [],
  loading: false,

  async load() {
    set({ loading: true });
    const [{ smsSources }, detectionEnabled] = await Promise.all([
      getRepositories(),
      appSettingsService.isSmsDetectionEnabled(),
    ]);
    const list = await smsSources.list();
    set({ sources: list, detectionEnabled, loading: false });
  },

  async setDetectionEnabled(value) {
    await appSettingsService.setSmsDetectionEnabled(value);
    set({ detectionEnabled: value });
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

  async removeSource(id) {
    const { smsSources } = await getRepositories();
    await smsSources.remove(id);
    set({ sources: get().sources.filter((s) => s.id !== id) });
  },
}));
