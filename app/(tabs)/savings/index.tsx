import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PocketCard } from '@/components/savings/PocketCard';
import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { useSavingsStore } from '@/state/savingsStore';
import { colors, spacing, typography } from '@/theme';

export default function SavingsScreen() {
  const pockets = useSavingsStore((s) => s.pockets);
  const load = useSavingsStore((s) => s.load);
  const deposit = useSavingsStore((s) => s.deposit);

  useEffect(() => {
    void load();
  }, [load]);

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
          <PocketCard key={pocket.id} pocket={pocket} onDeposit={(amount) => deposit(pocket.id, amount)} />
        ))
      )}

      <Button label="Nouvelle poche" onPress={() => router.push('/savings/new')} style={styles.newButton} />
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
  goalsButton: {
    marginBottom: spacing.lg,
  },
  newButton: {
    marginTop: spacing.lg,
  },
});
