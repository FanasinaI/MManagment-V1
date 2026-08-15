import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  error?: string;
}

export function TextField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, error }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.md,
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  error: {
    color: colors.semantic.danger,
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
  },
});
