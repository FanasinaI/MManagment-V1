import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, EmptyState, ListItem, Screen } from '@/components/ui';
import { signedAmount } from '@/domain/finance/balances';
import { useAccountsStore } from '@/state/accountsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatDate } from '@/utils/date';
import { formatSignedMoney } from '@/utils/money';

const TYPE_LABELS: Record<string, string> = {
  income: 'Revenu',
  expense: 'Dépense',
  transfer: 'Transfert',
  fee: 'Frais',
  withdrawal: 'Retrait',
  deposit: 'Dépôt',
};

export default function TransactionsScreen() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const loadTransactions = useTransactionsStore((s) => s.load);
  const pendingCount = useTransactionsStore((s) => s.pending.length);
  const loadPending = useTransactionsStore((s) => s.loadPending);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadTransactions();
    void loadPending();
    void loadAccounts();
    void loadCategories();
  }, [loadTransactions, loadPending, loadAccounts, loadCategories]);

  const accountNames = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const confirmed = transactions.filter((t) => t.status === 'confirmed');

  return (
    <Screen scroll>
      <Text style={styles.heading}>Transactions</Text>

      {pendingCount > 0 ? (
        <Button
          label={`${pendingCount} en attente de confirmation`}
          variant="secondary"
          onPress={() => router.push('/transactions/pending')}
          style={styles.pendingButton}
        />
      ) : null}

      <Card>
        {confirmed.length === 0 ? (
          <EmptyState title="Aucune transaction" subtitle="Ajoutez votre première transaction manuelle." />
        ) : (
          confirmed.map((tx) => {
            const delta = signedAmount(tx);
            return (
              <ListItem
                key={tx.id}
                title={(tx.categoryId && categoryNames.get(tx.categoryId)) || TYPE_LABELS[tx.type]}
                subtitle={`${accountNames.get(tx.accountId) ?? ''} · ${formatDate(new Date(tx.occurredAt))}`}
                right={
                  <Text
                    style={{
                      color: delta >= 0 ? colors.semantic.income : colors.semantic.expense,
                      fontWeight: typography.weight.medium,
                    }}
                  >
                    {formatSignedMoney(delta)}
                  </Text>
                }
                onPress={() => router.push(`/transactions/${tx.id}`)}
              />
            );
          })
        )}
      </Card>

      <Button label="Nouvelle transaction" onPress={() => router.push('/transactions/new')} style={styles.newButton} />
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
    pendingButton: {
      marginBottom: spacing.lg,
    },
    newButton: {
      marginTop: spacing.lg,
    },
  });
}
