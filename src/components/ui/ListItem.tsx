import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}

export function ListItem({ title, subtitle, right, onPress }: ListItemProps) {
  const content = (
    <View style={styles.row}>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
