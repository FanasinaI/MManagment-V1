import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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
  onWithdraw: (amount: number, accountId: string) => Promise<void>;
  onEdit: () => void;
}

const MODE_OPTIONS: { value: 'deposit' | 'withdraw'; label: string }[] = [
  { value: 'deposit', label: 'Ajouter' },
  { value: 'withdraw', label: 'Retirer' },
];

export function GoalCard({ goal, accounts, onContribute, onWithdraw, onEdit }: GoalCardProps) {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const progress = computeGoalProgress(goal);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const value = Number.parseFloat(amount.replace(',', '.'));
  const isValid = Boolean(value) && value > 0 && accountId !== null && (mode === 'deposit' || value <= goal.currentAmount);

  async function handleSubmit() {
    if (!isValid || !accountId) return;
    setSubmitting(true);
    try {
      if (mode === 'deposit') {
        await onContribute(value, accountId);
      } else {
        await onWithdraw(value, accountId);
      }
      setAmount('');
    } catch (error) {
      Alert.alert('Opération impossible', error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{goal.name}</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Ionicons name="pencil-outline" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>
      <ProgressBar ratio={progress.progressRatio} color={progress.isNear ? colors.semantic.warning : colors.gold[500]} />
      <Text style={styles.amountText}>
        {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
      </Text>
      {goal.targetDate ? <Text style={styles.dateText}>Échéance : {formatDate(new Date(goal.targetDate))}</Text> : null}

      {accounts.length === 0 ? (
        <Text style={styles.hint}>Ajoute un compte avant de pouvoir contribuer à cet objectif.</Text>
      ) : (
        <>
          <ChoiceChips options={MODE_OPTIONS} value={mode} onChange={setMode} />
          <Text style={styles.label}>{mode === 'deposit' ? 'Depuis quel compte ?' : 'Vers quel compte ?'}</Text>
          <ChoiceChips options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountId} onChange={setAccountId} />
          {mode === 'withdraw' && value > goal.currentAmount ? (
            <Text style={styles.warning}>Le montant dépasse ce qui a été épargné pour cet objectif.</Text>
          ) : null}
          <View style={styles.contributeRow}>
            <View style={styles.contributeInput}>
              <TextField
                label={mode === 'deposit' ? 'Contribution (Ar)' : 'Retrait (Ar)'}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <Button
              label={mode === 'deposit' ? 'Ajouter' : 'Retirer'}
              onPress={() => void handleSubmit()}
              loading={submitting}
              disabled={!isValid}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    warning: {
      color: colors.semantic.warning,
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
