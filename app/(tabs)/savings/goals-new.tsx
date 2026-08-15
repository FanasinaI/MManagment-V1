import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Screen, TextField } from '@/components/ui';
import { useGoalsStore } from '@/state/goalsStore';
import { colors, spacing, typography } from '@/theme';

export default function NewGoalScreen() {
  const addGoal = useGoalsStore((s) => s.addGoal);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && Number.parseFloat(targetAmount) > 0 && !submitting;

  async function handleCreate() {
    setSubmitting(true);
    try {
      const parsedDate = targetDate.trim() ? new Date(targetDate.trim()) : null;
      await addGoal({
        name: name.trim(),
        targetAmount: Number.parseFloat(targetAmount.replace(',', '.')),
        targetDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
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
      <TextField
        label="Date cible (AAAA-MM-JJ, optionnel)"
        value={targetDate}
        onChangeText={setTargetDate}
        placeholder="2026-12-31"
      />

      <Button label="Créer" onPress={() => void handleCreate()} disabled={!canSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text.primary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
});
