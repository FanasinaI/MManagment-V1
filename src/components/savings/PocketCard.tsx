import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ProgressBar, TextField } from '@/components/ui';
import { computeSavingsProgress } from '@/domain/finance/savingsEngine';
import { colors, spacing, typography } from '@/theme';
import { formatMoney } from '@/utils/money';
import type { SavingsPocket } from '@/validation/savingsSchema';

interface PocketCardProps {
  pocket: SavingsPocket;
  onDeposit: (amount: number) => Promise<void>;
}

export function PocketCard({ pocket, onDeposit }: PocketCardProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const progress = computeSavingsProgress(pocket);

  async function handleDeposit() {
    const value = Number.parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) return;
    setSubmitting(true);
    try {
      await onDeposit(value);
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
      <View style={styles.depositRow}>
        <View style={styles.depositInput}>
          <TextField label="Versement (Ar)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
        </View>
        <Button label="Verser" onPress={() => void handleDeposit()} loading={submitting} disabled={!amount} style={styles.depositButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  depositRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  depositInput: {
    flex: 1,
  },
  depositButton: {
    marginTop: spacing.lg,
  },
});
