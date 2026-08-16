import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PocketCard } from '@/components/savings/PocketCard';
import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { useAccountsStore } from '@/state/accountsStore';
import { useSavingsStore } from '@/state/savingsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function SavingsScreen() {
  const pockets = useSavingsStore((s) => s.pockets);
  const load = useSavingsStore((s) => s.load);
  const deposit = useSavingsStore((s) => s.deposit);
  const withdraw = useSavingsStore((s) => s.withdraw);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void load();
    void loadAccounts();
  }, [load, loadAccounts]);

  return (
    <Screen scroll>
      <Text style={styles.heading}>Épargne</Text>

      <Button label="Voir mes objectifs" variant="secondary" onPress={() => router.push('/savings/goals')} style={styles.goalsButton} />

      {pockets.length === 0 ? (
        <Card>
          <EmptyState title="Aucune poche d'épargne" subtitle="Créez une poche pour commencer à mettre de l'argent de côté." />
        </Card>
      ) : (
        pockets.map((pocket) => (
          <PocketCard
            key={pocket.id}
            pocket={pocket}
            accounts={accounts}
            onDeposit={(amount, accountId) => deposit(pocket.id, amount, accountId)}
            onWithdraw={(amount, accountId) => withdraw(pocket.id, amount, accountId)}
            onEdit={() => router.push(`/savings/${pocket.id}`)}
          />
        ))
      )}

      <Button label="Nouvelle poche" onPress={() => router.push('/savings/new')} style={styles.newButton} />
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
    goalsButton: {
      marginBottom: spacing.lg,
    },
    newButton: {
      marginTop: spacing.lg,
    },
  });
}
