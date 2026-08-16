import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
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

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = useTransactionsStore((s) => s.transactions.find((tx) => tx.id === id));
  const removeTransaction = useTransactionsStore((s) => s.remove);
  const accountName = useAccountsStore((s) => s.accounts.find((a) => a.id === transaction?.accountId)?.name);
  const toAccountName = useAccountsStore((s) => s.accounts.find((a) => a.id === transaction?.toAccountId)?.name);
  const categoryName = useCategoriesStore((s) => s.categories.find((c) => c.id === transaction?.categoryId)?.name);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const delta = useMemo(() => (transaction ? signedAmount(transaction) : 0), [transaction]);

  if (!transaction) {
    return (
      <Screen>
        <Text style={styles.notFound}>Transaction introuvable.</Text>
      </Screen>
    );
  }

  async function handleDelete() {
    await removeTransaction(transaction!.id);
    router.back();
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <Text style={[styles.amount, { color: delta >= 0 ? colors.semantic.income : colors.semantic.expense }]}>
          {formatSignedMoney(delta)}
        </Text>
        <DetailRow styles={styles} label="Type" value={TYPE_LABELS[transaction.type]} />
        <DetailRow styles={styles} label={transaction.type === 'transfer' ? 'Compte source' : 'Compte'} value={accountName ?? '—'} />
        {transaction.type === 'transfer' ? (
          <DetailRow styles={styles} label="Compte destination" value={toAccountName ?? '—'} />
        ) : (
          <DetailRow styles={styles} label="Catégorie" value={categoryName ?? '—'} />
        )}
        <DetailRow styles={styles} label="Date" value={formatDate(new Date(transaction.occurredAt))} />
        <DetailRow styles={styles} label="Source" value={transaction.source === 'sms' ? 'SMS' : 'Manuelle'} />
        <DetailRow styles={styles} label="Statut" value={transaction.status} />
        {transaction.note ? <DetailRow styles={styles} label="Note" value={transaction.note} /> : null}
      </Card>

      <Button label="Supprimer" variant="danger" onPress={() => void handleDelete()} style={styles.deleteButton} />
    </Screen>
  );
}

function DetailRow({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginTop: spacing.xl,
    },
    amount: {
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowLabel: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    rowValue: {
      color: colors.text.primary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
    },
    deleteButton: {
      marginTop: spacing.xl,
    },
    notFound: {
      color: colors.text.muted,
      marginTop: spacing.xl,
      textAlign: 'center',
    },
  });
}
