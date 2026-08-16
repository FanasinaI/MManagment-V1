import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, DateField, Screen, TextField } from '@/components/ui';
import { useGoalsStore } from '@/state/goalsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useGoalsStore((s) => s.goals.find((g) => g.id === id));
  const updateGoal = useGoalsStore((s) => s.updateGoal);
  const removeGoal = useGoalsStore((s) => s.removeGoal);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(String(goal.targetAmount));
      setTargetDate(goal.targetDate ? new Date(goal.targetDate) : null);
    }
  }, [goal]);

  if (!goal) {
    return (
      <Screen>
        <Text style={styles.notFound}>Objectif introuvable.</Text>
      </Screen>
    );
  }

  const canSubmit = name.trim().length > 0 && Number.parseFloat(targetAmount) > 0 && !submitting;

  async function handleSave() {
    setSubmitting(true);
    try {
      await updateGoal(goal!.id, {
        name: name.trim(),
        targetAmount: Number.parseFloat(targetAmount.replace(',', '.')),
        targetDate: targetDate ? targetDate.toISOString() : null,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await removeGoal(goal!.id);
      router.replace('/savings/goals');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Modifier l&apos;objectif</Text>

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

      <Button label="Enregistrer" onPress={() => void handleSave()} disabled={!canSubmit} loading={submitting} />

      {confirmingDelete ? (
        <>
          <Text style={styles.warning}>
            Supprimer cet objectif ne supprime pas les transactions déjà enregistrées, mais la progression sera perdue.
          </Text>
          <Button label="Confirmer la suppression" variant="danger" onPress={() => void handleDelete()} loading={submitting} style={styles.deleteButton} />
          <Button label="Annuler" variant="ghost" onPress={() => setConfirmingDelete(false)} disabled={submitting} />
        </>
      ) : (
        <Button label="Supprimer cet objectif" variant="danger" onPress={() => setConfirmingDelete(true)} style={styles.deleteButton} />
      )}
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
    deleteButton: {
      marginTop: spacing.xl,
    },
    warning: {
      color: colors.semantic.warning,
      fontSize: typography.size.xs,
      marginTop: spacing.lg,
    },
    notFound: {
      color: colors.text.muted,
      marginTop: spacing.xl,
      textAlign: 'center',
    },
  });
}
