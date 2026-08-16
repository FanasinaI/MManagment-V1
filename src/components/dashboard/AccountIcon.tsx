import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { PROVIDER_COLORS, PROVIDER_ICONS } from '@/domain/finance/accountProvider';
import { radius } from '@/theme';
import type { Account } from '@/validation/accountSchema';

interface AccountIconProps {
  provider: Account['provider'];
  size?: number;
}

export function AccountIcon({ provider, size = 36 }: AccountIconProps) {
  const tint = PROVIDER_COLORS[provider];
  return (
    <View style={[styles.square, { width: size, height: size, backgroundColor: `${tint}26` }]}>
      <Ionicons name={PROVIDER_ICONS[provider]} size={size * 0.55} color={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
