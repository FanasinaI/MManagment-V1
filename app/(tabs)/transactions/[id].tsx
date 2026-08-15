import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { signedAmount } from '@/domain/finance/balances';
import { useAccountsStore } from '@/state/accountsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { colors, spacing, typography } from '@/theme';
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
  const categoryName = useCategoriesStore((s) => s.categories.find((c) => c.id === transaction?.categoryId)?.name);

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
        <DetailRow label="Type" value={TYPE_LABELS[transaction.type]} />
        <DetailRow label="Compte" value={accountName ?? '—'} />
        <DetailRow label="Catégorie" value={categoryName ?? '—'} />
        <DetailRow label="Date" value={formatDate(new Date(transaction.occurredAt))} />
        <DetailRow label="Source" value={transaction.source === 'sms' ? 'SMS' : 'Manuelle'} />
        <DetailRow label="Statut" value={transaction.status} />
        {transaction.note ? <DetailRow label="Note" value={transaction.note} /> : null}
      </Card>

      <Button label="Supprimer" variant="danger" onPress={() => void handleDelete()} style={styles.deleteButton} />
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
