import { StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { radius, type ThemeColors } from '@/theme';

interface ProgressBarProps {
  ratio: number; // 0..1+ (values above 1 are clamped visually)
  color?: string;
}

export function ProgressBar({ ratio, color }: ProgressBarProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);
  const width = `${Math.min(Math.max(ratio, 0), 1) * 100}%` as const;
  const fillColor = ratio > 1 ? colors.semantic.danger : (color ?? colors.gold[500]);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: fillColor }]} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    track: {
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.background.surfaceAlt,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: radius.pill,
    },
  });
}
