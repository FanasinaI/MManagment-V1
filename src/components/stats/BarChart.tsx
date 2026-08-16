import { StyleSheet, Text, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { type ThemeColors } from '@/theme';

export interface BarChartPoint {
  label: string;
  income: number;
  expense: number;
}

interface BarChartProps {
  points: BarChartPoint[];
  height?: number;
}

/** Grouped income/expense bars per month — plain Views, no charting library needed. */
export function BarChart({ points, height = 140 }: BarChartProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]));
  const barAreaHeight = height - 24;

  return (
    <View style={[styles.row, { height }]}>
      {points.map((point, index) => (
        <View key={index} style={styles.column}>
          <View style={[styles.bars, { height: barAreaHeight }]}>
            <View
              style={[
                styles.bar,
                { height: Math.max(2, (point.income / max) * barAreaHeight), backgroundColor: colors.semantic.income },
              ]}
            />
            <View
              style={[
                styles.bar,
                { height: Math.max(2, (point.expense / max) * barAreaHeight), backgroundColor: colors.semantic.expense },
              ]}
            />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {point.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    column: {
      flex: 1,
      alignItems: 'center',
    },
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
    },
    bar: {
      width: 8,
      borderRadius: 2,
    },
    label: {
      color: colors.text.muted,
      fontSize: 10,
      marginTop: 6,
    },
  });
}
