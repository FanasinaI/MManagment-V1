import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
}

export function ListItem({ title, subtitle, left, right, onPress }: ListItemProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const content = (
    <View style={styles.row}>
      {left ? <View style={styles.leftSlot}>{left}</View> : null}
      <View style={styles.textColumn}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    leftSlot: {
      marginRight: spacing.md,
    },
    textColumn: {
      flex: 1,
      marginRight: spacing.md,
    },
    title: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.medium,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginTop: 2,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
