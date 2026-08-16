import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { alertsService } from '@/services/alerts/alertsService';
import type { Alert } from '@/validation/backupSchema';

interface AlertsState {
  alerts: Alert[];
  loading: boolean;
  load: () => Promise<void>;
  setAlert: (type: Alert['type'], enabled: boolean, threshold?: number | null) => Promise<void>;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { alerts } = await getRepositories();
    const list = await alerts.list();
    set({ alerts: list, loading: false });
  },

  async setAlert(type, enabled, threshold) {
    const { alerts } = await getRepositories();
    const existing = get().alerts.find((a) => a.type === type);
    const resolvedThreshold = threshold !== undefined ? threshold : (existing?.threshold ?? null);
    const updated = await alerts.upsert({ id: existing?.id, type, enabled, threshold: resolvedThreshold });
    set({ alerts: [...get().alerts.filter((a) => a.type !== type), updated] });

    if (type === 'savings_reminder') {
      await alertsService.setSavingsReminder(enabled, resolvedThreshold ?? undefined);
    }
  },
}));
