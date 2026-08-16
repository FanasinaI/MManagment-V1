import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, DateField, Screen, TextField } from '@/components/ui';
import { useGoalsStore } from '@/state/goalsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function NewGoalScreen() {
  const addGoal = useGoalsStore((s) => s.addGoal);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const canSubmit = name.trim().length > 0 && Number.parseFloat(targetAmount) > 0 && !submitting;

  async function handleCreate() {
    setSubmitting(true);
    try {
      await addGoal({
        name: name.trim(),
        targetAmount: Number.parseFloat(targetAmount.replace(',', '.')),
        targetDate: targetDate ? targetDate.toISOString() : null,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Nouvel objectif</Text>

      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex : Voiture" />
      <TextField label="Montant cible (Ar)" value={targetAmount} onChangeText={setTargetAmount} placeholder="0" keyboardType="numeric" />

      {targetDate ? (
        <>
          <DateField label="Date cible" value={targetDate} onChange={setTargetDate} minimumDate={new Date()} />
          <Button label="Retirer la date cible" variant="ghost" onPress={() => setTargetDate(null)} style={styles.removeDate} />
        </>
      ) : (
        <Button
          label="+ Ajouter une date cible"
          variant="secondary"
          onPress={() => setTargetDate(new Date())}
          style={styles.addDate}
        />
      )}

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
    addDate: {
      marginBottom: spacing.lg,
    },
    removeDate: {
      marginTop: -spacing.sm,
      marginBottom: spacing.lg,
    },
  });
}
