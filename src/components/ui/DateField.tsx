import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { radius, spacing, type ThemeColors, typography } from '@/theme';
import { formatDate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

/** Tap-to-open native date picker — replaces manual "AAAA-MM-JJ" text entry. */
export function DateField({ label, value, onChange, maximumDate, minimumDate }: DateFieldProps) {
  const [show, setShow] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Text style={styles.value}>{formatDate(value)}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(event, selectedDate) => {
            setShow(false);
            if (event.type === 'set' && selectedDate) onChange(selectedDate);
          }}
        />
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.xs,
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    value: {
      color: colors.text.primary,
      fontSize: typography.size.md,
    },
  });
}
