import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChoiceChips, ProgressBar, TextField } from '@/components/ui';
import { computeGoalProgress } from '@/domain/finance/goalsEngine';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import type { Account } from '@/validation/accountSchema';
import type { Goal } from '@/validation/goalSchema';

interface GoalCardProps {
  goal: Goal;
  accounts: Account[];
  onContribute: (amount: number, accountId: string) => Promise<void>;
}

export function GoalCard({ goal, accounts, onContribute }: GoalCardProps) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const progress = computeGoalProgress(goal);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  async function handleContribute() {
    const value = Number.parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0 || !accountId) return;
    setSubmitting(true);
    try {
      await onContribute(value, accountId);
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

      {accounts.length === 0 ? (
        <Text style={styles.hint}>Ajoute un compte avant de pouvoir contribuer à cet objectif.</Text>
      ) : (
        <>
          <Text style={styles.label}>Depuis quel compte ?</Text>
          <ChoiceChips options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountId} onChange={setAccountId} />
          <View style={styles.contributeRow}>
            <View style={styles.contributeInput}>
              <TextField label="Contribution (Ar)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
            </View>
            <Button
              label="Ajouter"
              onPress={() => void handleContribute()}
              loading={submitting}
              disabled={!amount || !accountId}
              style={styles.contributeButton}
            />
          </View>
        </>
      )}
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
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginTop: spacing.sm,
    },
    hint: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
    },
    contributeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    contributeInput: {
      flex: 1,
    },
    contributeButton: {
      marginTop: spacing.lg,
    },
  });
}
