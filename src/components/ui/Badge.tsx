import { StyleSheet, Text, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { radius, spacing, type ThemeColors, typography } from '@/theme';

interface BadgeProps {
  label: string;
  tone?: 'income' | 'expense' | 'pending' | 'info';
}

export function Badge({ label, tone = 'info' }: BadgeProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);
  return (
    <View style={[styles.badge, { backgroundColor: toneColor(colors, tone) }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function toneColor(colors: ThemeColors, tone: NonNullable<BadgeProps['tone']>): string {
  switch (tone) {
    case 'income':
      return colors.semantic.income;
    case 'expense':
      return colors.semantic.expense;
    case 'pending':
      return colors.semantic.pending;
    default:
      return colors.semantic.info;
  }
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    label: {
      color: colors.text.onGold,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.semibold,
    },
  });
}
