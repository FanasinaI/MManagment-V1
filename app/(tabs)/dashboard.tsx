import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountIcon } from '@/components/dashboard/AccountIcon';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { DeltaBadge } from '@/components/stats/DeltaBadge';
import { Button, Card, ListItem, Screen } from '@/components/ui';
import { PROVIDER_LABELS } from '@/domain/finance/accountProvider';
import { totalBalance } from '@/domain/finance/balances';
import { computeMonthlyExpenseByCategory } from '@/domain/finance/expenseBreakdown';
import { computeMonthlyTrend } from '@/domain/finance/monthlyTrend';
import { useAccountsStore } from '@/state/accountsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useSecurityStore } from '@/state/securityStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { darkColors, spacing, type ThemeColors, typography } from '@/theme';
import { chartColorForIndex } from '@/theme/chartPalette';
import { formatMoney } from '@/utils/money';
import { percentDelta } from '@/utils/percent';

export default function DashboardScreen() {
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const transactions = useTransactionsStore((s) => s.transactions);
  const loadTransactions = useTransactionsStore((s) => s.load);
  const pendingCount = useTransactionsStore((s) => s.pending.length);
  const loadPending = useTransactionsStore((s) => s.loadPending);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const username = useSecurityStore((s) => s.username);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadAccounts();
    void loadTransactions();
    void loadPending();
    void loadCategories();
  }, [loadAccounts, loadTransactions, loadPending, loadCategories]);

  const total = totalBalance(accounts);
  const trend = useMemo(() => computeMonthlyTrend(transactions, 2), [transactions]);
  const previousMonth = trend[0] ?? { income: 0, expense: 0 };
  const currentMonth = trend[1] ?? { income: 0, expense: 0 };
  const monthlyNet = currentMonth.income - currentMonth.expense;
  const previousNet = previousMonth.income - previousMonth.expense;
  const netDelta = percentDelta(monthlyNet, previousNet);
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const breakdown = useMemo(() => computeMonthlyExpenseByCategory(transactions), [transactions]);
  const topBreakdown = breakdown.slice(0, 5);
  const monthlyExpenseTotal = breakdown.reduce((sum, entry) => sum + entry.amount, 0);
  const slices = topBreakdown.map((entry, index) => ({ value: entry.amount, color: chartColorForIndex(index) }));

  const previousMonthDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), []);
  const previousMonthExpenseTotal = useMemo(
    () => computeMonthlyExpenseByCategory(transactions, previousMonthDate).reduce((sum, entry) => sum + entry.amount, 0),
    [transactions, previousMonthDate]
  );
  const expenseDelta = percentDelta(monthlyExpenseTotal, previousMonthExpenseTotal);
  const netIndicatorIsUp = netDelta !== null ? netDelta >= 0 : monthlyNet >= 0;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour{username ? `, ${username}` : ''} 👋</Text>
        <Pressable onPress={() => router.push('/transactions/pending')}>
          <Ionicons
            name={pendingCount > 0 ? 'notifications' : 'notifications-outline'}
            size={22}
            color={pendingCount > 0 ? colors.semantic.pending : colors.text.secondary}
          />
        </Pressable>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Patrimoine total</Text>
        <Text style={styles.totalValue}>{formatMoney(total)}</Text>
        <Text style={[styles.flowIndicator, { color: netIndicatorIsUp ? darkColors.semantic.income : darkColors.semantic.expense }]}>
          {netDelta !== null
            ? `${netIndicatorIsUp ? '▲' : '▼'} ${Math.abs(Math.round(netDelta))}% vs mois dernier`
            : `${netIndicatorIsUp ? '▲' : '▼'} ${formatMoney(Math.abs(monthlyNet))} ce mois`}
        </Text>
      </View>

      {pendingCount > 0 ? (
        <Card style={styles.pendingCard}>
          <Text style={styles.pendingText}>{pendingCount} transaction(s) SMS en attente de confirmation</Text>
          <Button label="Vérifier" variant="secondary" onPress={() => router.push('/transactions/pending')} />
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Comptes</Text>
        <Text style={styles.link} onPress={() => router.push('/accounts')}>
          Voir tout ›
        </Text>
      </View>
      <Card style={styles.card}>
        {accounts.length === 0 ? (
          <Text style={styles.empty}>Aucun compte pour le moment.</Text>
        ) : (
          accounts.map((account) => (
            <ListItem
              key={account.id}
              title={account.name}
              subtitle={PROVIDER_LABELS[account.provider]}
              left={<AccountIcon provider={account.provider} />}
              right={<Text style={styles.accountBalance}>{formatMoney(account.balance, account.currency)}</Text>}
            />
          ))
        )}
      </Card>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Dépenses du mois</Text>
          {monthlyExpenseTotal > 0 ? <DeltaBadge delta={expenseDelta} goodDirection="down" /> : null}
        </View>
        <Text style={styles.link} onPress={() => router.push('/stats')}>
          Statistiques ›
        </Text>
      </View>
      <Card style={styles.expenseCard}>
        {monthlyExpenseTotal === 0 ? (
          <Text style={styles.empty}>Aucune dépense confirmée ce mois-ci.</Text>
        ) : (
          <View style={styles.expenseRow}>
            <DonutChart slices={slices} size={110} strokeWidth={16} />
            <View style={styles.legend}>
              {topBreakdown.map((entry, index) => (
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
        )}
      </Card>

      <View style={styles.addAccountButton}>
        <Button label="Ajouter un compte" variant="secondary" onPress={() => router.push('/accounts/new')} />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    greeting: {
      color: colors.text.primary,
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
    },
    totalCard: {
      backgroundColor: darkColors.background.primary,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    totalLabel: {
      color: darkColors.text.secondary,
      fontSize: typography.size.sm,
    },
    totalValue: {
      color: darkColors.gold[500],
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      marginTop: spacing.xs,
    },
    flowIndicator: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      marginTop: spacing.sm,
    },
    pendingCard: {
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    pendingText: {
      color: colors.semantic.pending,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      marginBottom: spacing.md,
    },
    link: {
      color: colors.gold[600],
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
    },
    card: {
      marginBottom: spacing.lg,
    },
    empty: {
      color: colors.text.muted,
      fontSize: typography.size.sm,
    },
    accountBalance: {
      color: colors.text.primary,
      fontWeight: typography.weight.medium,
    },
    expenseCard: {
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
    addAccountButton: {
      marginTop: spacing.lg,
    },
  });
}
