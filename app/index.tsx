import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { appSettingsService } from '@/services/settings/appSettingsService';
import { useThemeStore } from '@/state/themeStore';
import { type ThemeColors } from '@/theme';

type Target = 'onboarding' | 'dashboard';

export default function Index() {
  const [target, setTarget] = useState<Target | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    (async () => {
      const onboardingCompleted = await appSettingsService.isOnboardingCompleted();
      setTarget(onboardingCompleted ? 'dashboard' : 'onboarding');
    })();
  }, []);

  if (!target) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold[500]} />
      </View>
    );
  }

  return <Redirect href={target === 'onboarding' ? '/onboarding' : '/(tabs)/dashboard'} />;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.primary,
    },
  });
}
