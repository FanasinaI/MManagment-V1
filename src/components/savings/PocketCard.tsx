import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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
  onWithdraw: (amount: number, accountId: string) => Promise<void>;
  onEdit: () => void;
}

const MODE_OPTIONS: { value: 'deposit' | 'withdraw'; label: string }[] = [
  { value: 'deposit', label: 'Verser' },
  { value: 'withdraw', label: 'Retirer' },
];

export function PocketCard({ pocket, accounts, onDeposit, onWithdraw, onEdit }: PocketCardProps) {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const progress = computeSavingsProgress(pocket);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const value = Number.parseFloat(amount.replace(',', '.'));
  const isValid = Boolean(value) && value > 0 && accountId !== null && (mode === 'deposit' || value <= pocket.balance);

  async function handleSubmit() {
    if (!isValid || !accountId) return;
    setSubmitting(true);
    try {
      if (mode === 'deposit') {
        await onDeposit(value, accountId);
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
        <Text style={styles.name}>{pocket.name}</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Ionicons name="pencil-outline" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>
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
          <ChoiceChips options={MODE_OPTIONS} value={mode} onChange={setMode} />
          <Text style={styles.label}>{mode === 'deposit' ? 'Depuis quel compte ?' : 'Vers quel compte ?'}</Text>
          <ChoiceChips options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountId} onChange={setAccountId} />
          {mode === 'withdraw' && value > pocket.balance ? (
            <Text style={styles.warning}>Le montant dépasse le solde de la poche.</Text>
          ) : null}
          <View style={styles.depositRow}>
            <View style={styles.depositInput}>
              <TextField
                label={mode === 'deposit' ? 'Versement (Ar)' : 'Retrait (Ar)'}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <Button
              label={mode === 'deposit' ? 'Verser' : 'Retirer'}
              onPress={() => void handleSubmit()}
              loading={submitting}
              disabled={!isValid}
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
