import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Screen, TextField } from '@/components/ui';
import { useSavingsStore } from '@/state/savingsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function NewSavingsPocketScreen() {
  const addPocket = useSavingsStore((s) => s.addPocket);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function handleCreate() {
    setSubmitting(true);
    try {
      const parsedTarget = Number.parseFloat(targetAmount.replace(',', '.'));
      await addPocket({ name: name.trim(), targetAmount: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Nouvelle poche d&apos;épargne</Text>

      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex : Vacances" />
      <TextField
        label="Objectif (Ar, optionnel)"
        value={targetAmount}
        onChangeText={setTargetAmount}
        placeholder="0"
        keyboardType="numeric"
      />

      <Button label="Créer" onPress={() => void handleCreate()} disabled={!canSubmit} loading={submitting} />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    heading: {
      color: colors.text.primary,
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
  });
}
