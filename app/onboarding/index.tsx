import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, Screen, TextField } from '@/components/ui';
import { PROVIDER_LABELS, PROVIDER_TO_TYPE, PROVIDERS } from '@/domain/finance/accountProvider';
import { useAccountsStore } from '@/state/accountsStore';
import { colors, spacing, typography } from '@/theme';
import type { Account } from '@/validation/accountSchema';

const PROVIDER_OPTIONS = PROVIDERS.map((provider) => ({ value: provider, label: PROVIDER_LABELS[provider] }));

export default function OnboardingScreen() {
  const addAccount = useAccountsStore((s) => s.addAccount);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<Account['provider'] | null>(null);
  const [balance, setBalance] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && provider !== null && !submitting;

  async function handleCreate() {
    if (!provider) return;
    setSubmitting(true);
    try {
      await addAccount({
        name: name.trim(),
        provider,
        type: PROVIDER_TO_TYPE[provider],
        currency: 'MGA',
        balance: Number.parseFloat(balance.replace(',', '.')) || 0,
      });
      router.replace('/(tabs)/dashboard');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Bienvenue sur MManagment</Text>
      <Text style={styles.subtitle}>Créez votre premier compte pour commencer.</Text>

      <TextField label="Nom du compte" value={name} onChangeText={setName} placeholder="Ex : MVola principal" />

      <Text style={styles.label}>Type de compte</Text>
      <ChoiceChips options={PROVIDER_OPTIONS} value={provider} onChange={setProvider} />

      <TextField
        label="Solde initial (Ar)"
        value={balance}
        onChangeText={setBalance}
        placeholder="0"
        keyboardType="numeric"
      />

      <Button label="Créer mon premier compte" onPress={() => void handleCreate()} disabled={!canSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.gold[500],
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    marginBottom: spacing.sm,
  },
});
