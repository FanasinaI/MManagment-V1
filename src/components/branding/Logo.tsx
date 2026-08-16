import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useThemeStore } from '@/state/themeStore';

interface LogoProps {
  size?: number;
}

/**
 * Vector re-creation of the MM gold-ring monogram (no bitmap asset available
 * to embed here) — a gold circular ring with "MM" centered. Reused on the
 * loading screen and the PIN gate.
 */
export function Logo({ size = 96 }: LogoProps) {
  const colors = useThemeStore((s) => s.colors);
  const strokeWidth = size * 0.055;
  const radius = size / 2 - strokeWidth;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.gold[500]} strokeWidth={strokeWidth} fill="none" />
      </Svg>
      <Text style={[styles.monogram, { fontSize: size * 0.34, color: colors.gold[500] }]}>MM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    position: 'absolute',
    fontWeight: '800',
    letterSpacing: -1,
  },
});
