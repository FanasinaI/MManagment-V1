import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { radius, spacing, type ThemeColors, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, style }: ButtonProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.text.onGold : colors.text.primary} />
      ) : (
        <Text style={[styles.label, variant === 'primary' ? styles.labelOnGold : styles.labelDefault]}>{label}</Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
    },
    labelOnGold: {
      color: colors.text.onGold,
    },
    labelDefault: {
      color: colors.text.primary,
    },
    primary: {
      backgroundColor: colors.gold[500],
    },
    secondary: {
      backgroundColor: colors.background.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.semantic.danger,
    },
  });
}
