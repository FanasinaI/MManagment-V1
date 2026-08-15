import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationContent } from './notificationTemplates';

const CHANNEL_ID = 'mmanagment-alerts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** CDC §10: local-only scheduling, no push server involved. */
export const notificationService = {
  async requestPermission(): Promise<boolean> {
    const settings = await Notifications.requestPermissionsAsync();
    return settings.granted;
  },

  async ensureChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertes MManagment',
      importance: Notifications.AndroidImportance.HIGH,
    });
  },

  async sendImmediate(content: NotificationContent): Promise<string> {
    return Notifications.scheduleNotificationAsync({ content, trigger: null });
  },

  async scheduleAt(content: NotificationContent, date: Date): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
    });
  },

  /** e.g. the 25th of every month for the savings reminder (CDC §10). */
  async scheduleMonthly(content: NotificationContent, day: number, hour: number, minute: number): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day, hour, minute, channelId: CHANNEL_ID },
    });
  },

  async cancel(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  },
};
