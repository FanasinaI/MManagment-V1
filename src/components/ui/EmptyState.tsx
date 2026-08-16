import { StyleSheet, Text, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
