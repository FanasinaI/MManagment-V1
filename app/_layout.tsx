import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { PinGate } from '@/components/security/PinGate';
import { getRepositories } from '@/db/repositories';
import { appSettingsService } from '@/services/settings/appSettingsService';
import { smsListenerService } from '@/services/sms/smsListenerService';
import { smsPermissionService } from '@/services/sms/smsPermissionService';
import { useSecurityStore } from '@/state/securityStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const checkStatus = useSecurityStore((s) => s.checkStatus);
  const hasPin = useSecurityStore((s) => s.hasPin);
  const isUnlocked = useSecurityStore((s) => s.isUnlocked);

  useEffect(() => {
    (async () => {
      await getRepositories();
      await checkStatus();
      setDbReady(true);
      await SplashScreen.hideAsync().catch(() => {});

      // Resume listening silently on relaunch if the user already enabled
      // detection and already granted the permission — does not re-prompt.
      const [detectionEnabled, permissionGranted] = await Promise.all([
        appSettingsService.isSmsDetectionEnabled(),
        smsPermissionService.isGranted(),
      ]);
      if (detectionEnabled && permissionGranted) {
        await smsListenerService.start();
      }
    })();
  }, [checkStatus]);

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold[500]} />
      </View>
    );
  }

  if (hasPin && !isUnlocked) {
    return <PinGate />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
});
