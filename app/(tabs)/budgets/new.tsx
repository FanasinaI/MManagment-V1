import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, Screen, TextField } from '@/components/ui';
import { useBudgetsStore } from '@/state/budgetsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { colors, spacing, typography } from '@/theme';
import type { BudgetPeriod } from '@/utils/date';

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
];

export default function NewBudgetScreen() {
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const addBudget = useBudgetsStore((s) => s.addBudget);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [period, setPeriod] = useState<BudgetPeriod | null>('monthly');
  const [amount, setAmount] = useState('');
  const [threshold, setThreshold] = useState('80');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const canSubmit = categoryId !== null && period !== null && Number.parseFloat(amount) > 0 && !submitting;

  async function handleCreate() {
    if (!categoryId || !period) return;
    setSubmitting(true);
    try {
      await addBudget({
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

  return (
    <Screen scroll>
      <Text style={styles.heading}>Nouveau budget</Text>

      {categories.length === 0 ? (
        <Text style={styles.hint}>Créez d&apos;abord une catégorie dans Paramètres.</Text>
      ) : (
        <>
          <Text style={styles.label}>Catégorie</Text>
          <ChoiceChips
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
          />
        </>
      )}

      <Text style={styles.label}>Période</Text>
      <ChoiceChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />

      <TextField label="Montant (Ar)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
      <TextField label="Seuil d'alerte (%)" value={threshold} onChangeText={setThreshold} placeholder="80" keyboardType="numeric" />

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
  label: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.text.muted,
    fontSize: typography.size.sm,
    marginBottom: spacing.lg,
  },
});
