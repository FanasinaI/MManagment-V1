import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DonutChart } from '@/components/dashboard/DonutChart';
import { BarChart } from '@/components/stats/BarChart';
import { Card, EmptyState, ProgressBar, Screen } from '@/components/ui';
import { totalBalance } from '@/domain/finance/balances';
import { computeBudgetProgress } from '@/domain/finance/budgetEngine';
import { computeMonthlyExpenseByCategory } from '@/domain/finance/expenseBreakdown';
import { computeGoalProgress } from '@/domain/finance/goalsEngine';
import { computeMonthlyTrend } from '@/domain/finance/monthlyTrend';
import { computeMonthlySavingsMovement, computeSavingsMovementTotals } from '@/domain/finance/savingsMovement';
import { useAccountsStore } from '@/state/accountsStore';
import { useBudgetsStore } from '@/state/budgetsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useGoalsStore } from '@/state/goalsStore';
import { useSavingsStore } from '@/state/savingsStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { chartColorForIndex } from '@/theme/chartPalette';
import { formatMoney } from '@/utils/money';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
const TREND_MONTHS = 6;

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export default function StatsScreen() {
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const transactions = useTransactionsStore((s) => s.transactions);
  const loadTransactions = useTransactionsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const budgets = useBudgetsStore((s) => s.budgets);
  const loadBudgets = useBudgetsStore((s) => s.load);
  const pockets = useSavingsStore((s) => s.pockets);
  const loadPockets = useSavingsStore((s) => s.load);
  const goals = useGoalsStore((s) => s.goals);
  const loadGoals = useGoalsStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadAccounts();
    void loadTransactions();
    void loadCategories();
    void loadBudgets();
    void loadPockets();
    void loadGoals();
  }, [loadAccounts, loadTransactions, loadCategories, loadBudgets, loadPockets, loadGoals]);

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const trend = useMemo(() => computeMonthlyTrend(transactions, TREND_MONTHS), [transactions]);
  const currentMonth = trend[trend.length - 1] ?? { income: 0, expense: 0 };
  const previousMonth = trend[trend.length - 2] ?? { income: 0, expense: 0 };
  const trendTotals = useMemo(
    () => trend.reduce((acc, p) => ({ income: acc.income + p.income, expense: acc.expense + p.expense }), { income: 0, expense: 0 }),
    [trend]
  );

  const savingsThisMonth = useMemo(() => computeMonthlySavingsMovement(transactions), [transactions]);
  const savingsLastMonth = useMemo(
    () => computeMonthlySavingsMovement(transactions, new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)),
    [transactions]
  );
  const savings6Months = useMemo(() => computeSavingsMovementTotals(transactions, TREND_MONTHS), [transactions]);

  const savingsRate = currentMonth.income > 0 ? (savingsThisMonth.net / currentMonth.income) * 100 : null;
  const incomeDelta = percentDelta(currentMonth.income, previousMonth.income);
  const expenseDelta = percentDelta(currentMonth.expense, previousMonth.expense);

  const breakdown = useMemo(() => computeMonthlyExpenseByCategory(transactions), [transactions]);
  const monthlyExpenseTotal = breakdown.reduce((sum, entry) => sum + entry.amount, 0);
  const slices = breakdown.map((entry, index) => ({ value: entry.amount, color: chartColorForIndex(index) }));

  const budgetProgresses = useMemo(
    () =>
      budgets.map((budget) => ({
        budget,
        progress: computeBudgetProgress(
          budget,
          transactions.map((t) => ({ categoryId: t.categoryId, amount: t.amount, type: t.type, status: t.status, occurredAt: t.occurredAt }))
        ),
      })),
    [budgets, transactions]
  );

  const pocketsTotal = pockets.reduce((sum, p) => sum + p.balance, 0);
  const goalsCurrentTotal = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const goalsTargetTotal = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const goalsOverallRatio = goalsTargetTotal > 0 ? goalsCurrentTotal / goalsTargetTotal : 0;
  const accountsTotal = totalBalance(accounts);
  const netWorth = accountsTotal + pocketsTotal + goalsCurrentTotal;

  return (
    <Screen scroll>
      <Text style={styles.heading}>Statistiques</Text>

      {/* --- Ce mois-ci : revenus, dépenses et épargne clairement séparés --- */}
      <Text style={styles.sectionTitle}>Ce mois-ci</Text>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Revenus</Text>
          <Text style={[styles.summaryValue, { color: colors.semantic.income }]}>{formatMoney(currentMonth.income)}</Text>
          <DeltaBadge delta={incomeDelta} goodDirection="up" colors={colors} />
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Dépenses</Text>
          <Text style={[styles.summaryValue, { color: colors.semantic.expense }]}>{formatMoney(currentMonth.expense)}</Text>
          <DeltaBadge delta={expenseDelta} goodDirection="down" colors={colors} />
        </Card>
      </View>
      <Card style={styles.savingsSummaryCard}>
        <View style={styles.savingsSummaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Épargne (poches + objectifs)</Text>
            <Text style={[styles.summaryValue, { color: colors.gold[500] }]}>{formatMoney(savingsThisMonth.net)}</Text>
          </View>
          <DeltaBadge delta={percentDelta(savingsThisMonth.net, savingsLastMonth.net)} goodDirection="up" colors={colors} />
        </View>
        <Text style={styles.hint}>
          {savingsRate !== null
            ? `Taux d'épargne : ${Math.round(savingsRate)}% des revenus du mois`
            : "Pas de revenus ce mois-ci pour calculer un taux d'épargne"}
        </Text>
        <Text style={styles.hint}>
          Versé : {formatMoney(savingsThisMonth.deposited)} · Retiré : {formatMoney(savingsThisMonth.withdrawn)}
        </Text>
      </Card>
      <Text style={styles.note}>
        Un versement vers une poche d&apos;épargne ou un objectif n&apos;est pas une dépense — c&apos;est de l&apos;argent qui reste
        le tien, juste mis de côté. Il est donc compté à part, jamais dans les dépenses.
      </Text>

      {/* --- Répartition des dépenses --- */}
      <Text style={styles.sectionTitle}>Dépenses par catégorie (ce mois)</Text>
      <Card style={styles.card}>
        {monthlyExpenseTotal === 0 ? (
          <EmptyState title="Aucune dépense" subtitle="Aucune dépense confirmée ce mois-ci." />
        ) : (
          <>
            <View style={styles.expenseRow}>
              <DonutChart slices={slices} size={110} strokeWidth={16} />
              <View style={styles.legend}>
                {breakdown.map((entry, index) => (
                  <View key={entry.categoryId ?? 'none'} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: chartColorForIndex(index) }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {entry.categoryId ? (categoryNames.get(entry.categoryId) ?? 'Autre') : 'Sans catégorie'}
                    </Text>
                    <Text style={styles.legendValue}>{formatMoney(entry.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.totalRow}>Total : {formatMoney(monthlyExpenseTotal)}</Text>
          </>
        )}
      </Card>

      {/* --- Budgets --- */}
      <Text style={styles.sectionTitle}>Budgets</Text>
      <Card style={styles.card}>
        {budgetProgresses.length === 0 ? (
          <EmptyState title="Aucun budget" subtitle="Définissez un budget par catégorie pour suivre vos limites ici." />
        ) : (
          budgetProgresses.map(({ budget, progress }) => (
            <View key={budget.id} style={styles.budgetRow}>
              <View style={styles.budgetHeaderRow}>
                <Text style={styles.budgetName}>{categoryNames.get(budget.categoryId) ?? 'Catégorie'}</Text>
                <Text style={styles.budgetAmount}>
                  {formatMoney(progress.spent)} / {formatMoney(progress.amount)}
                </Text>
              </View>
              <ProgressBar ratio={progress.ratio} color={progress.isNearThreshold ? colors.semantic.warning : colors.gold[500]} />
            </View>
          ))
        )}
      </Card>

      {/* --- Patrimoine net : tout regroupé --- */}
      <Text style={styles.sectionTitle}>Patrimoine net</Text>
      <Card style={styles.card}>
        <DetailRow label="Comptes" value={formatMoney(accountsTotal)} styles={styles} />
        <DetailRow label="Poches d'épargne" value={formatMoney(pocketsTotal)} styles={styles} />
        <DetailRow label="Objectifs (progression)" value={formatMoney(goalsCurrentTotal)} styles={styles} />
        <View style={styles.netWorthDivider} />
        <DetailRow label="Total" value={formatMoney(netWorth)} styles={styles} bold />
        {goals.length > 0 ? (
          <View style={styles.goalsProgressBlock}>
            <Text style={styles.hint}>
              Objectifs : {formatMoney(goalsCurrentTotal)} / {formatMoney(goalsTargetTotal)} ({goals.length} objectif
              {goals.length > 1 ? 's' : ''})
            </Text>
            <ProgressBar ratio={goalsOverallRatio} />
          </View>
        ) : null}
      </Card>

      {/* --- Évolution mensuelle --- */}
      <Text style={styles.sectionTitle}>Évolution sur {TREND_MONTHS} mois</Text>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Revenus</Text>
          <Text style={[styles.summaryValue, { color: colors.semantic.income }]}>{formatMoney(trendTotals.income)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Dépenses</Text>
          <Text style={[styles.summaryValue, { color: colors.semantic.expense }]}>{formatMoney(trendTotals.expense)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Épargne</Text>
          <Text style={[styles.summaryValue, { color: colors.gold[500] }]}>{formatMoney(savings6Months.net)}</Text>
        </Card>
      </View>
      <Card style={styles.chartCard}>
        <BarChart points={trend.map((p) => ({ label: MONTH_LABELS[p.month], income: p.income, expense: p.expense }))} />
        <View style={styles.legendFooter}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.semantic.income }]} />
            <Text style={styles.legendLabel}>Revenus</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.semantic.expense }]} />
            <Text style={styles.legendLabel}>Dépenses</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.link} onPress={() => router.push('/settings/export')}>
        Exporter le détail en Excel ›
      </Text>
    </Screen>
  );
}

function DeltaBadge({
  delta,
  goodDirection,
  colors,
}: {
  delta: number | null;
  goodDirection: 'up' | 'down';
  colors: ThemeColors;
}) {
  if (delta === null) return null;
  const isFlat = Math.round(delta) === 0;
  const isUp = delta > 0;
  const isGood = isFlat ? true : goodDirection === 'up' ? isUp : !isUp;
  const color = isFlat ? colors.text.muted : isGood ? colors.semantic.income : colors.semantic.expense;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
      {!isFlat ? <Ionicons name={isUp ? 'arrow-up' : 'arrow-down'} size={12} color={color} /> : null}
      <Text style={{ color, fontSize: typography.size.xs, marginLeft: 2 }}>
        {isFlat ? '=' : `${Math.abs(Math.round(delta))}%`} vs mois dernier
      </Text>
    </View>
  );
}

function DetailRow({ label, value, styles, bold }: { label: string; value: string; styles: ReturnType<typeof createStyles>; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
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
    sectionTitle: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    summaryCard: {
      flex: 1,
    },
    summaryLabel: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    summaryValue: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.bold,
      marginTop: spacing.xs,
    },
    savingsSummaryCard: {
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    savingsSummaryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    hint: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
    },
    note: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
      fontStyle: 'italic',
      marginBottom: spacing.lg,
    },
    card: {
      marginBottom: spacing.lg,
    },
    expenseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    legend: {
      flex: 1,
      gap: spacing.sm,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendLabel: {
      flex: 1,
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    legendValue: {
      color: colors.text.primary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
    },
    totalRow: {
      color: colors.text.primary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      marginTop: spacing.md,
      textAlign: 'right',
    },
    budgetRow: {
      marginBottom: spacing.md,
      gap: spacing.xs,
    },
    budgetHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    budgetName: {
      color: colors.text.primary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
    },
    budgetAmount: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    rowLabel: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    rowLabelBold: {
      color: colors.text.primary,
      fontWeight: typography.weight.semibold,
    },
    rowValue: {
      color: colors.text.primary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
    },
    rowValueBold: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      color: colors.gold[500],
    },
    netWorthDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    goalsProgressBlock: {
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    chartCard: {
      marginBottom: spacing.lg,
    },
    legendFooter: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginTop: spacing.lg,
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    link: {
      color: colors.gold[600],
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
  });
}
