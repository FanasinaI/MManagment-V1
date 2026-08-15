import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  title: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.muted,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
