import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, DateField, Screen, TextField } from '@/components/ui';
import { useAccountsStore } from '@/state/accountsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import type { Transaction } from '@/validation/transactionSchema';

const TYPE_OPTIONS: { value: Transaction['type']; label: string }[] = [
  { value: 'income', label: 'Revenu' },
  { value: 'expense', label: 'Dépense' },
  { value: 'transfer', label: 'Transfert' },
  { value: 'fee', label: 'Frais' },
  { value: 'withdrawal', label: 'Retrait' },
  { value: 'deposit', label: 'Dépôt' },
];

export default function NewTransactionScreen() {
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const addManual = useTransactionsStore((s) => s.addManual);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [type, setType] = useState<Transaction['type'] | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadAccounts();
    void loadCategories();
  }, [loadAccounts, loadCategories]);

  const isTransfer = type === 'transfer';
  const canSubmit =
    accountId !== null &&
    type !== null &&
    Number.parseFloat(amount) > 0 &&
    (!isTransfer || (toAccountId !== null && toAccountId !== accountId)) &&
    !submitting;

  async function handleCreate() {
    if (!accountId || !type) return;
    setSubmitting(true);
    try {
      await addManual({
        accountId,
        toAccountId: isTransfer && toAccountId ? toAccountId : undefined,
        type,
        amount: Number.parseFloat(amount.replace(',', '.')),
        categoryId: isTransfer ? null : categoryId,
        occurredAt: occurredAt.toISOString(),
        note: note.trim() || undefined,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Nouvelle transaction</Text>

      <Text style={styles.label}>{isTransfer ? 'Compte source' : 'Compte'}</Text>
      <ChoiceChips
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        value={accountId}
        onChange={(value) => {
          setAccountId(value);
          if (value === toAccountId) setToAccountId(null);
        }}
      />

      <Text style={styles.label}>Type</Text>
      <ChoiceChips
        options={TYPE_OPTIONS}
        value={type}
        onChange={(value) => {
          setType(value);
          if (value !== 'transfer') setToAccountId(null);
        }}
      />

      {isTransfer ? (
        <>
          <Text style={styles.label}>Compte destination</Text>
          <ChoiceChips
            options={accounts.filter((a) => a.id !== accountId).map((a) => ({ value: a.id, label: a.name }))}
            value={toAccountId}
            onChange={setToAccountId}
          />
        </>
      ) : categories.length > 0 ? (
        <>
          <Text style={styles.label}>Catégorie</Text>
          <ChoiceChips
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
          />
        </>
      ) : null}

      <TextField label="Montant (Ar)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
      <DateField label="Date" value={occurredAt} onChange={setOccurredAt} maximumDate={new Date()} />
      <TextField label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Ex : Courses au marché" />

      <Button label="Enregistrer" onPress={() => void handleCreate()} disabled={!canSubmit} loading={submitting} />
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
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.sm,
    },
  });
}
