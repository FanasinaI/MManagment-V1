import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface BadgeProps {
  label: string;
  tone?: 'income' | 'expense' | 'pending' | 'info';
}

export function Badge({ label, tone = 'info' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: toneColor(tone) }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function toneColor(tone: NonNullable<BadgeProps['tone']>): string {
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

const styles = StyleSheet.create({
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
