import { StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';

import { LoadingDots } from './LoadingDots';
import { Logo } from './Logo';

export function LoadingScreen() {
  const colors = useThemeStore((s) => s.colors);
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Logo size={96} />
      <LoadingDots />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
