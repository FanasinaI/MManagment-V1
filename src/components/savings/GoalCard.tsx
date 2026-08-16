import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ProgressBar, TextField } from '@/components/ui';
import { computeGoalProgress } from '@/domain/finance/goalsEngine';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import type { Goal } from '@/validation/goalSchema';

interface GoalCardProps {
  goal: Goal;
  onContribute: (amount: number) => Promise<void>;
}

export function GoalCard({ goal, onContribute }: GoalCardProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const progress = computeGoalProgress(goal);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  async function handleContribute() {
    const value = Number.parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) return;
    setSubmitting(true);
    try {
      await onContribute(value);
      setAmount('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.name}>{goal.name}</Text>
      <ProgressBar ratio={progress.progressRatio} color={progress.isNear ? colors.semantic.warning : colors.gold[500]} />
      <Text style={styles.amountText}>
        {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
      </Text>
      {goal.targetDate ? <Text style={styles.dateText}>Échéance : {formatDate(new Date(goal.targetDate))}</Text> : null}
      <View style={styles.contributeRow}>
        <View style={styles.contributeInput}>
          <TextField label="Contribution (Ar)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
        </View>
        <Button
          label="Ajouter"
          onPress={() => void handleContribute()}
          loading={submitting}
          disabled={!amount}
          style={styles.contributeButton}
        />
      </View>
    </Card>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    name: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
    },
    amountText: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    dateText: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
    },
    contributeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    contributeInput: {
      flex: 1,
    },
    contributeButton: {
      marginTop: spacing.lg,
    },
  });
}
