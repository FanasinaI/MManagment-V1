import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ListItem, Screen } from '@/components/ui';
import { useAccountsStore } from '@/state/accountsStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

export default function PendingTransactionsScreen() {
  const pending = useTransactionsStore((s) => s.pending);
  const loadPending = useTransactionsStore((s) => s.loadPending);
  const confirmPending = useTransactionsStore((s) => s.confirmPending);
  const rejectPending = useTransactionsStore((s) => s.rejectPending);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadPending();
    void loadAccounts();
  }, [loadPending, loadAccounts]);

  const accountNames = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <Screen scroll>
      <Text style={styles.heading}>Transactions en attente</Text>

      {pending.length === 0 ? (
        <EmptyState
          title="Rien en attente"
          subtitle="Les transactions détectées par SMS apparaîtront ici pour confirmation."
        />
      ) : (
        pending.map((tx) => (
          <Card key={tx.id} style={styles.card}>
            <ListItem title={formatMoney(tx.amount)} subtitle={`${accountNames.get(tx.accountId) ?? ''} · ${formatDate(new Date(tx.occurredAt))}`} />
            <Text style={styles.hint}>Détecté par SMS — vérifiez avant de confirmer.</Text>
            <View style={styles.actions}>
              <Button label="Rejeter" variant="secondary" onPress={() => void rejectPending(tx.id)} style={styles.actionButton} />
              <Button label="Confirmer" onPress={() => void confirmPending(tx.id)} style={styles.actionButton} />
            </View>
          </Card>
        ))
      )}
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
      marginBottom: spacing.lg,
    },
    hint: {
      color: colors.semantic.pending,
      fontSize: typography.size.xs,
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    actionButton: {
      flex: 1,
    },
  });
}
