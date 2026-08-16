import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { radius, spacing, type ThemeColors } from '@/theme';

export const CATEGORY_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'fast-food-outline',
  'restaurant-outline',
  'cafe-outline',
  'cart-outline',
  'bag-outline',
  'home-outline',
  'flash-outline',
  'water-outline',
  'wifi-outline',
  'car-outline',
  'bus-outline',
  'airplane-outline',
  'medkit-outline',
  'fitness-outline',
  'school-outline',
  'book-outline',
  'briefcase-outline',
  'card-outline',
  'cash-outline',
  'wallet-outline',
  'gift-outline',
  'game-controller-outline',
  'film-outline',
  'shirt-outline',
  'paw-outline',
  'build-outline',
  'phone-portrait-outline',
  'heart-outline',
  'people-outline',
  'ellipsis-horizontal-outline',
];

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  return (
    <View style={styles.grid}>
      {CATEGORY_ICONS.map((icon) => {
        const selected = icon === value;
        return (
          <Pressable key={icon} onPress={() => onChange(icon)} style={[styles.swatch, selected && styles.swatchSelected]}>
            <Ionicons name={icon} size={20} color={selected ? colors.text.onGold : colors.text.secondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    swatchSelected: {
      backgroundColor: colors.gold[500],
      borderColor: colors.gold[500],
    },
  });
}
