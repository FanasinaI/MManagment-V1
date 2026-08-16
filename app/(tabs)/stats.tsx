import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BarChart } from '@/components/stats/BarChart';
import { Card, Screen } from '@/components/ui';
import { computeMonthlyTrend } from '@/domain/finance/monthlyTrend';
import { useTransactionsStore } from '@/state/transactionsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatMoney } from '@/utils/money';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export default function StatsScreen() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const loadTransactions = useTransactionsStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const trend = useMemo(() => computeMonthlyTrend(transactions, 6), [transactions]);
  const totals = useMemo(
    () =>
      trend.reduce(
        (acc, point) => ({ income: acc.income + point.income, expense: acc.expense + point.expense }),
        { income: 0, expense: 0 }
      ),
    [trend]
  );

  return (
    <Screen scroll>
      <Text style={styles.heading}>Statistiques</Text>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Revenus (6 mois)</Text>
          <Text style={[styles.summaryValue, { color: colors.semantic.income }]}>{formatMoney(totals.income)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Dépenses (6 mois)</Text>
          <Text style={[styles.summaryValue, { color: colors.semantic.expense }]}>{formatMoney(totals.expense)}</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Évolution mensuelle</Text>
      <Card style={styles.chartCard}>
        <BarChart points={trend.map((p) => ({ label: MONTH_LABELS[p.month], income: p.income, expense: p.expense }))} />
        <View style={styles.legend}>
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
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
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
    sectionTitle: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      marginBottom: spacing.md,
    },
    chartCard: {
      marginBottom: spacing.lg,
    },
    legend: {
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
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendLabel: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
  });
}
