import { Switch } from 'react-native';

import { colors } from '@/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
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
