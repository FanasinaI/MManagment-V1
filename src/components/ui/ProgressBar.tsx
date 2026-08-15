import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

interface ProgressBarProps {
  ratio: number; // 0..1+ (values above 1 are clamped visually)
  color?: string;
}

export function ProgressBar({ ratio, color = colors.gold[500] }: ProgressBarProps) {
  const width = `${Math.min(Math.max(ratio, 0), 1) * 100}%` as const;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: ratio > 1 ? colors.semantic.danger : color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
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
