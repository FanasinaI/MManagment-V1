import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, DateField, Screen, TextField } from '@/components/ui';
import { useAccountsStore } from '@/state/accountsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useRecurringStore } from '@/state/recurringStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import type { RecurrenceFrequency } from '@/validation/recurringTransactionSchema';
import type { Transaction } from '@/validation/transactionSchema';

const TYPE_OPTIONS: { value: Transaction['type']; label: string }[] = [
  { value: 'income', label: 'Revenu' },
  { value: 'expense', label: 'Dépense' },
  { value: 'transfer', label: 'Transfert' },
  { value: 'fee', label: 'Frais' },
  { value: 'withdrawal', label: 'Retrait' },
  { value: 'deposit', label: 'Dépôt' },
];

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'monthly', label: 'Chaque mois' },
  { value: 'yearly', label: 'Chaque année' },
];

const TYPES_WITHOUT_CATEGORY = new Set<Transaction['type']>(['transfer', 'deposit']);

export default function EditRecurringTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rule = useRecurringStore((s) => s.rules.find((r) => r.id === id));
  const loadRules = useRecurringStore((s) => s.load);
  const updateRule = useRecurringStore((s) => s.updateRule);
  const removeRule = useRecurringStore((s) => s.removeRule);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadRules();
    void loadAccounts();
    void loadCategories();
  }, [loadRules, loadAccounts, loadCategories]);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [type, setType] = useState<Transaction['type'] | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency | null>(null);
  const [nextOccurrence, setNextOccurrence] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (rule) {
      setAccountId(rule.accountId);
      setToAccountId(rule.toAccountId);
      setType(rule.type);
      setCategoryId(rule.categoryId);
      setAmount(String(rule.amount));
      setFrequency(rule.frequency);
      setNextOccurrence(new Date(rule.nextOccurrence));
      setNote(rule.note ?? '');
    }
  }, [rule]);

  if (!rule) {
    return (
      <Screen>
        <Text style={styles.notFound}>Règle introuvable.</Text>
      </Screen>
    );
  }

  const isTransfer = type === 'transfer';
  const showCategory = type !== null && !TYPES_WITHOUT_CATEGORY.has(type) && categories.length > 0;
  const canSubmit =
    accountId !== null &&
    type !== null &&
    frequency !== null &&
    Number.parseFloat(amount) > 0 &&
    (!isTransfer || (toAccountId !== null && toAccountId !== accountId)) &&
    !submitting;

  async function handleSave() {
    if (!accountId || !type || !frequency) return;
    setSubmitting(true);
    try {
      await updateRule(rule!.id, {
        accountId,
        toAccountId: isTransfer && toAccountId ? toAccountId : undefined,
        type,
        amount: Number.parseFloat(amount.replace(',', '.')),
        categoryId: TYPES_WITHOUT_CATEGORY.has(type) ? null : categoryId,
        frequency,
        nextOccurrence: nextOccurrence.toISOString(),
        note: note.trim() || undefined,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await removeRule(rule!.id);
      router.replace('/settings/recurring');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Modifier la règle</Text>

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
      ) : showCategory ? (
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

      <Text style={styles.label}>Fréquence</Text>
      <ChoiceChips options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />

      <DateField label="Prochaine échéance" value={nextOccurrence} onChange={setNextOccurrence} />
      <TextField label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Ex : Loyer appartement" />

      <Button label="Enregistrer" onPress={() => void handleSave()} disabled={!canSubmit} loading={submitting} />

      {confirmingDelete ? (
        <>
          <Text style={styles.warning}>Supprimer cette règle ne supprime pas les transactions déjà générées.</Text>
          <Button label="Confirmer la suppression" variant="danger" onPress={() => void handleDelete()} loading={submitting} style={styles.deleteButton} />
          <Button label="Annuler" variant="ghost" onPress={() => setConfirmingDelete(false)} disabled={submitting} />
        </>
      ) : (
        <Button label="Supprimer cette règle" variant="danger" onPress={() => setConfirmingDelete(true)} style={styles.deleteButton} />
      )}
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
    deleteButton: {
      marginTop: spacing.xl,
    },
    warning: {
      color: colors.semantic.warning,
      fontSize: typography.size.xs,
      marginTop: spacing.lg,
    },
    notFound: {
      color: colors.text.muted,
      marginTop: spacing.xl,
      textAlign: 'center',
    },
  });
}
