import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { GoalCard } from '@/components/savings/GoalCard';
import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { useAccountsStore } from '@/state/accountsStore';
import { useGoalsStore } from '@/state/goalsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function GoalsScreen() {
  const goals = useGoalsStore((s) => s.goals);
  const load = useGoalsStore((s) => s.load);
  const contribute = useGoalsStore((s) => s.contribute);
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
      <Text style={styles.heading}>Objectifs</Text>

      {goals.length === 0 ? (
        <Card>
          <EmptyState title="Aucun objectif" subtitle="Fixez un montant cible et une date pour rester motivé." />
        </Card>
      ) : (
        goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            accounts={accounts}
            onContribute={(amount, accountId) => contribute(goal.id, amount, accountId)}
          />
        ))
      )}

      <Button label="Nouvel objectif" onPress={() => router.push('/savings/goals-new')} style={styles.newButton} />
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
    newButton: {
      marginTop: spacing.lg,
    },
  });
}
