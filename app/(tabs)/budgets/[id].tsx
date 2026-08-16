import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, Screen, TextField } from '@/components/ui';
import { useBudgetsStore } from '@/state/budgetsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import type { BudgetPeriod } from '@/utils/date';

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
];

export default function EditBudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const budget = useBudgetsStore((s) => s.budgets.find((b) => b.id === id));
  const updateBudget = useBudgetsStore((s) => s.updateBudget);
  const removeBudget = useBudgetsStore((s) => s.removeBudget);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [period, setPeriod] = useState<BudgetPeriod | null>(null);
  const [amount, setAmount] = useState('');
  const [threshold, setThreshold] = useState('80');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.categoryId);
      setPeriod(budget.period);
      setAmount(String(budget.amount));
      setThreshold(String(Math.round(budget.threshold * 100)));
    }
  }, [budget]);

  if (!budget) {
    return (
      <Screen>
        <Text style={styles.notFound}>Budget introuvable.</Text>
      </Screen>
    );
  }

  const canSubmit = categoryId !== null && period !== null && Number.parseFloat(amount) > 0 && !submitting;

  async function handleSave() {
    if (!categoryId || !period) return;
    setSubmitting(true);
    try {
      await updateBudget(budget!.id, {
        categoryId,
        amount: Number.parseFloat(amount.replace(',', '.')),
        period,
        threshold: Math.min(Math.max(Number.parseFloat(threshold) / 100, 0), 1) || 0.8,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await removeBudget(budget!.id);
      router.replace('/budgets');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Modifier le budget</Text>

      <Text style={styles.label}>Catégorie</Text>
      <ChoiceChips options={categories.map((c) => ({ value: c.id, label: c.name }))} value={categoryId} onChange={setCategoryId} />

      <Text style={styles.label}>Période</Text>
      <ChoiceChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />

      <TextField label="Montant (Ar)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
      <TextField label="Seuil d'alerte (%)" value={threshold} onChangeText={setThreshold} placeholder="80" keyboardType="numeric" />

      <Button label="Enregistrer" onPress={() => void handleSave()} disabled={!canSubmit} loading={submitting} />

      {confirmingDelete ? (
        <>
          <Text style={styles.warning}>Supprimer ce budget est irréversible.</Text>
          <Button label="Confirmer la suppression" variant="danger" onPress={() => void handleDelete()} loading={submitting} style={styles.deleteButton} />
          <Button label="Annuler" variant="ghost" onPress={() => setConfirmingDelete(false)} disabled={submitting} />
        </>
      ) : (
        <Button label="Supprimer ce budget" variant="danger" onPress={() => setConfirmingDelete(true)} style={styles.deleteButton} />
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
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.sm,
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
