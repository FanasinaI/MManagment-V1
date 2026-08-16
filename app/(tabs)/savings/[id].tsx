import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Screen, TextField } from '@/components/ui';
import { useSavingsStore } from '@/state/savingsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function EditSavingsPocketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pocket = useSavingsStore((s) => s.pockets.find((p) => p.id === id));
  const updatePocket = useSavingsStore((s) => s.updatePocket);
  const removePocket = useSavingsStore((s) => s.removePocket);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (pocket) {
      setName(pocket.name);
      setTargetAmount(pocket.targetAmount ? String(pocket.targetAmount) : '');
    }
  }, [pocket]);

  if (!pocket) {
    return (
      <Screen>
        <Text style={styles.notFound}>Poche d&apos;épargne introuvable.</Text>
      </Screen>
    );
  }

  const canSubmit = name.trim().length > 0 && !submitting;

  async function handleSave() {
    setSubmitting(true);
    try {
      const parsedTarget = Number.parseFloat(targetAmount.replace(',', '.'));
      await updatePocket(pocket!.id, {
        name: name.trim(),
        targetAmount: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await removePocket(pocket!.id);
      router.replace('/savings');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Modifier la poche</Text>

      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex : Vacances" />
      <TextField
        label="Objectif (Ar, optionnel)"
        value={targetAmount}
        onChangeText={setTargetAmount}
        placeholder="0"
        keyboardType="numeric"
      />

      <Button label="Enregistrer" onPress={() => void handleSave()} disabled={!canSubmit} loading={submitting} />

      {confirmingDelete ? (
        <>
          <Text style={styles.warning}>
            Supprimer cette poche ne supprime pas les transactions déjà enregistrées, mais l&apos;épargne accumulée sera perdue.
          </Text>
          <Button label="Confirmer la suppression" variant="danger" onPress={() => void handleDelete()} loading={submitting} style={styles.deleteButton} />
          <Button label="Annuler" variant="ghost" onPress={() => setConfirmingDelete(false)} disabled={submitting} />
        </>
      ) : (
        <Button label="Supprimer cette poche" variant="danger" onPress={() => setConfirmingDelete(true)} style={styles.deleteButton} />
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
