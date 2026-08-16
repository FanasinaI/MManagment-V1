import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

interface DeltaBadgeProps {
  /** A percentDelta() result — null renders nothing (no prior-month baseline to compare against). */
  delta: number | null;
  /** Whether an increase is the desirable direction (income) or the undesirable one (expense). */
  goodDirection: 'up' | 'down';
}

/** Small ▲/▼ X% "vs mois dernier" badge, colored green/red by whether the change is favorable. */
export function DeltaBadge({ delta, goodDirection }: DeltaBadgeProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  if (delta === null) return null;

  const isFlat = Math.round(delta) === 0;
  const isUp = delta > 0;
  const isGood = isFlat ? true : goodDirection === 'up' ? isUp : !isUp;
  const color = isFlat ? colors.text.muted : isGood ? colors.semantic.income : colors.semantic.expense;

  return (
    <View style={styles.row}>
      {!isFlat ? <Ionicons name={isUp ? 'arrow-up' : 'arrow-down'} size={12} color={color} /> : null}
      <Text style={[styles.label, { color }]}>{isFlat ? '=' : `${Math.abs(Math.round(delta))}%`} vs mois dernier</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    label: {
      fontSize: typography.size.xs,
      marginLeft: 2,
    },
  });
}
