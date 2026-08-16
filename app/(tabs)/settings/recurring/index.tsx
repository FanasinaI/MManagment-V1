import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button, Card, EmptyState, ListItem, Screen, Toggle } from '@/components/ui';
import { useAccountsStore } from '@/state/accountsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useRecurringStore } from '@/state/recurringStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

const TYPE_LABELS: Record<string, string> = {
  income: 'Revenu',
  expense: 'Dépense',
  transfer: 'Transfert',
  fee: 'Frais',
  withdrawal: 'Retrait',
  deposit: 'Dépôt',
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Chaque semaine',
  monthly: 'Chaque mois',
  yearly: 'Chaque année',
};

export default function RecurringTransactionsScreen() {
  const rules = useRecurringStore((s) => s.rules);
  const load = useRecurringStore((s) => s.load);
  const setActive = useRecurringStore((s) => s.setActive);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void load();
    void loadAccounts();
    void loadCategories();
  }, [load, loadAccounts, loadCategories]);

  const accountNames = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  return (
    <Screen scroll>
      <Text style={styles.heading}>Transactions récurrentes</Text>
      <Text style={styles.subheading}>Loyer, salaire, abonnements — générées automatiquement à leur échéance.</Text>

      <Card style={styles.card}>
        {rules.length === 0 ? (
          <EmptyState title="Aucune règle" subtitle="Ajoutez une transaction qui se répète automatiquement." />
        ) : (
          rules.map((rule) => (
            <Pressable key={rule.id} onPress={() => router.push(`/settings/recurring/${rule.id}`)}>
              <ListItem
                title={(rule.categoryId && categoryNames.get(rule.categoryId)) || rule.note || TYPE_LABELS[rule.type]}
                subtitle={`${accountNames.get(rule.accountId) ?? ''} · ${formatMoney(rule.amount)} · ${FREQUENCY_LABELS[rule.frequency]} · Prochaine : ${formatDate(new Date(rule.nextOccurrence))}`}
                right={<Toggle value={rule.active} onValueChange={(value) => void setActive(rule.id, value)} />}
              />
            </Pressable>
          ))
        )}
      </Card>

      <Button label="Nouvelle règle" onPress={() => router.push('/settings/recurring/new')} style={styles.newButton} />
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
      marginBottom: spacing.xs,
    },
    subheading: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.lg,
    },
    card: {
      marginBottom: spacing.lg,
    },
    newButton: {
      marginTop: spacing.lg,
    },
  });
}
