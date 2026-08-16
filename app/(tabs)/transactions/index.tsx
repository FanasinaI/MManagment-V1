import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChoiceChips, EmptyState, ListItem, Screen, TextField } from '@/components/ui';
import { signedAmount } from '@/domain/finance/balances';
import { applyTransactionFilters, EMPTY_TRANSACTION_FILTERS, hasActiveFilters, type TransactionListFilters } from '@/domain/finance/transactionFilters';
import { useAccountsStore } from '@/state/accountsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatDate } from '@/utils/date';
import { formatSignedMoney } from '@/utils/money';
import type { Transaction } from '@/validation/transactionSchema';

const TYPE_LABELS: Record<string, string> = {
  income: 'Revenu',
  expense: 'Dépense',
  transfer: 'Transfert',
  fee: 'Frais',
  withdrawal: 'Retrait',
  deposit: 'Dépôt',
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

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

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionListFilters>(EMPTY_TRANSACTION_FILTERS);

  useEffect(() => {
    void loadTransactions();
    void loadPending();
    void loadAccounts();
    void loadCategories();
  }, [loadTransactions, loadPending, loadAccounts, loadCategories]);

  const accountNames = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const confirmed = useMemo(() => transactions.filter((t) => t.status === 'confirmed'), [transactions]);

  const filtered = useMemo(
    () =>
      applyTransactionFilters(confirmed, filters, {
        searchableText: (tx) =>
          `${tx.note ?? ''} ${(tx.categoryId && categoryNames.get(tx.categoryId)) || ''} ${accountNames.get(tx.accountId) ?? ''}`,
        accountId: (tx) => tx.accountId,
        type: (tx) => tx.type,
      }),
    [confirmed, filters, categoryNames, accountNames]
  );

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.heading}>Transactions</Text>
        <Pressable onPress={() => setShowFilters((v) => !v)}>
          <Ionicons
            name={showFilters ? 'filter' : 'filter-outline'}
            size={22}
            color={hasActiveFilters(filters) ? colors.gold[500] : colors.text.secondary}
          />
        </Pressable>
      </View>

      <TextField
        label="Rechercher"
        value={filters.query}
        onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
        placeholder="Note, catégorie, compte…"
      />

      {showFilters ? (
        <>
          <Text style={styles.label}>Compte</Text>
          <ChoiceChips
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            value={filters.accountId}
            onChange={(accountId) => setFilters((f) => ({ ...f, accountId: f.accountId === accountId ? null : accountId }))}
          />
          <Text style={styles.label}>Type</Text>
          <ChoiceChips
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(type) => setFilters((f) => ({ ...f, type: f.type === type ? null : type }))}
          />
        </>
      ) : null}

      {hasActiveFilters(filters) ? (
        <Button label="Réinitialiser les filtres" variant="ghost" onPress={() => setFilters(EMPTY_TRANSACTION_FILTERS)} style={styles.resetButton} />
      ) : null}

      {pendingCount > 0 ? (
        <Button
          label={`${pendingCount} en attente de confirmation`}
          variant="secondary"
          onPress={() => router.push('/transactions/pending')}
          style={styles.pendingButton}
        />
      ) : null}

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title={confirmed.length === 0 ? 'Aucune transaction' : 'Aucun résultat'}
            subtitle={confirmed.length === 0 ? 'Ajoutez votre première transaction manuelle.' : 'Essayez avec d’autres filtres.'}
          />
        ) : (
          filtered.map((tx: Transaction) => {
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    heading: {
      color: colors.text.primary,
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
    },
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.sm,
    },
    resetButton: {
      marginBottom: spacing.md,
    },
    pendingButton: {
      marginBottom: spacing.lg,
    },
    newButton: {
      marginTop: spacing.lg,
    },
  });
}
