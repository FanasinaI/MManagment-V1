import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChoiceChips, ProgressBar, TextField } from '@/components/ui';
import { computeSavingsProgress } from '@/domain/finance/savingsEngine';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatMoney } from '@/utils/money';
import type { Account } from '@/validation/accountSchema';
import type { SavingsPocket } from '@/validation/savingsSchema';

interface PocketCardProps {
  pocket: SavingsPocket;
  accounts: Account[];
  onDeposit: (amount: number, accountId: string) => Promise<void>;
}

export function PocketCard({ pocket, accounts, onDeposit }: PocketCardProps) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const progress = computeSavingsProgress(pocket);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  async function handleDeposit() {
    const value = Number.parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0 || !accountId) return;
    setSubmitting(true);
    try {
      await onDeposit(value, accountId);
      setAmount('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.name}>{pocket.name}</Text>
      {progress.progressRatio !== null ? (
        <>
          <ProgressBar ratio={progress.progressRatio} />
          <Text style={styles.amountText}>
            {formatMoney(pocket.balance)} / {formatMoney(pocket.targetAmount ?? 0)}
          </Text>
        </>
      ) : (
        <Text style={styles.amountText}>{formatMoney(pocket.balance)}</Text>
      )}

      {accounts.length === 0 ? (
        <Text style={styles.hint}>Ajoute un compte avant de pouvoir y verser de l'épargne.</Text>
      ) : (
        <>
          <Text style={styles.label}>Depuis quel compte ?</Text>
          <ChoiceChips options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountId} onChange={setAccountId} />
          <View style={styles.depositRow}>
            <View style={styles.depositInput}>
              <TextField label="Versement (Ar)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
            </View>
            <Button
              label="Verser"
              onPress={() => void handleDeposit()}
              loading={submitting}
              disabled={!amount || !accountId}
              style={styles.depositButton}
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
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginTop: spacing.sm,
    },
    hint: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
    },
    depositRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    depositInput: {
      flex: 1,
    },
    depositButton: {
      marginTop: spacing.lg,
    },
  });
}
