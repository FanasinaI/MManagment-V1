import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, EmptyState, ProgressBar, Screen } from '@/components/ui';
import { computeBudgetProgress } from '@/domain/finance/budgetEngine';
import { useBudgetsStore } from '@/state/budgetsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatMoney } from '@/utils/money';

export default function BudgetsScreen() {
  const budgets = useBudgetsStore((s) => s.budgets);
  const loadBudgets = useBudgetsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const transactions = useTransactionsStore((s) => s.transactions);
  const loadTransactions = useTransactionsStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadBudgets();
    void loadCategories();
    void loadTransactions();
  }, [loadBudgets, loadCategories, loadTransactions]);

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  return (
    <Screen scroll>
      <Text style={styles.heading}>Budgets</Text>

      {budgets.length === 0 ? (
        <Card>
          <EmptyState title="Aucun budget" subtitle="Définissez un budget par catégorie et par période." />
        </Card>
      ) : (
        budgets.map((budget) => {
          const progress = computeBudgetProgress(
            budget,
            transactions.map((t) => ({
              categoryId: t.categoryId ?? null,
              amount: t.amount,
              type: t.type,
              status: t.status,
              occurredAt: t.occurredAt,
            }))
          );
          return (
            <Card key={budget.id} style={styles.card}>
              <Text style={styles.categoryName}>{categoryNames.get(budget.categoryId) ?? 'Catégorie'}</Text>
              <ProgressBar ratio={progress.ratio} color={progress.isNearThreshold ? colors.semantic.warning : colors.gold[500]} />
              <Text style={styles.amountText}>
                {formatMoney(progress.spent)} / {formatMoney(progress.amount)}
              </Text>
              {progress.isOverBudget ? (
                <Text style={styles.overBudget}>Budget dépassé</Text>
              ) : progress.isNearThreshold ? (
                <Text style={styles.nearThreshold}>Proche du seuil</Text>
              ) : null}
            </Card>
          );
        })
      )}

      <Button label="Nouveau budget" onPress={() => router.push('/budgets/new')} style={styles.newButton} />
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
    card: {
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    categoryName: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
    },
    amountText: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    overBudget: {
      color: colors.semantic.danger,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
    },
    nearThreshold: {
      color: colors.semantic.warning,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
    },
    newButton: {
      marginTop: spacing.lg,
    },
  });
}
