import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ListItem, Screen } from '@/components/ui';
import { PROVIDER_LABELS } from '@/domain/finance/accountProvider';
import { cashflow, totalBalance } from '@/domain/finance/balances';
import { useAccountsStore } from '@/state/accountsStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { colors, spacing, typography } from '@/theme';
import { formatMoney } from '@/utils/money';

export default function DashboardScreen() {
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const transactions = useTransactionsStore((s) => s.transactions);
  const loadTransactions = useTransactionsStore((s) => s.load);
  const pendingCount = useTransactionsStore((s) => s.pending.length);
  const loadPending = useTransactionsStore((s) => s.loadPending);

  useEffect(() => {
    void loadAccounts();
    void loadTransactions();
    void loadPending();
  }, [loadAccounts, loadTransactions, loadPending]);

  const total = totalBalance(accounts);
  const flow = cashflow(transactions);

  return (
    <Screen scroll>
      <Text style={styles.heading}>Tableau de bord</Text>

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Solde total</Text>
        <Text style={styles.totalValue}>{formatMoney(total)}</Text>
      </Card>

      {pendingCount > 0 ? (
        <Card style={styles.pendingCard}>
          <Text style={styles.pendingText}>{pendingCount} transaction(s) SMS en attente de confirmation</Text>
          <Button label="Vérifier" variant="secondary" onPress={() => router.push('/transactions/pending')} />
        </Card>
      ) : null}

      <View style={styles.row}>
        <Card style={styles.flowCard}>
          <Text style={styles.flowLabel}>Revenus</Text>
          <Text style={[styles.flowValue, { color: colors.semantic.income }]}>{formatMoney(flow.income)}</Text>
        </Card>
        <Card style={styles.flowCard}>
          <Text style={styles.flowLabel}>Dépenses</Text>
          <Text style={[styles.flowValue, { color: colors.semantic.expense }]}>{formatMoney(flow.expense)}</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Comptes</Text>
      <Card>
        {accounts.length === 0 ? (
          <Text style={styles.empty}>Aucun compte pour le moment.</Text>
        ) : (
          accounts.map((account) => (
            <ListItem
              key={account.id}
              title={account.name}
              subtitle={PROVIDER_LABELS[account.provider]}
              right={<Text style={styles.accountBalance}>{formatMoney(account.balance, account.currency)}</Text>}
            />
          ))
        )}
      </Card>
      <View style={styles.addAccountButton}>
        <Button label="Ajouter un compte" variant="secondary" onPress={() => router.push('/accounts/new')} />
      </View>
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
  totalCard: {
    marginBottom: spacing.lg,
  },
  totalLabel: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
  },
  totalValue: {
    color: colors.gold[500],
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xs,
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  flowCard: {
    flex: 1,
  },
  flowLabel: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
  },
  flowValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  empty: {
    color: colors.text.muted,
    fontSize: typography.size.sm,
  },
  accountBalance: {
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  addAccountButton: {
    marginTop: spacing.lg,
  },
});
