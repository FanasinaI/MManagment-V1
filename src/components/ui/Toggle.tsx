import { Switch } from 'react-native';

import { useThemeStore } from '@/state/themeStore';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  const colors = useThemeStore((s) => s.colors);
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.background.surfaceAlt, true: colors.gold[600] }}
      thumbColor={colors.neutral[0]}
    />
  );
}
