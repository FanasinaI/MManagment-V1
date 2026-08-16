import Svg, { Circle } from 'react-native-svg';

import { useThemeStore } from '@/state/themeStore';

export interface DonutSlice {
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}

/** Simple stroke-dasharray donut — no charting library needed. */
export function DonutChart({ slices, size = 120, strokeWidth = 18 }: DonutChartProps) {
  const colors = useThemeStore((s) => s.colors);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  let cumulative = 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total <= 0 ? (
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.background.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
      ) : (
        slices
          .filter((slice) => slice.value > 0)
          .map((slice, index) => {
            const fraction = slice.value / total;
            const dashArray = `${fraction * circumference} ${circumference}`;
            const dashOffset = -cumulative * circumference;
            cumulative += fraction;
            return (
              <Circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                fill="none"
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            );
          })
      )}
    </Svg>
  );
}
