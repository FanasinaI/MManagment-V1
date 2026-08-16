import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/branding/Logo';
import { Button, ChoiceChips, Screen, TextField } from '@/components/ui';
import { PROVIDER_LABELS, PROVIDER_TO_TYPE, PROVIDERS } from '@/domain/finance/accountProvider';
import { useAccountsStore } from '@/state/accountsStore';
import { useSecurityStore } from '@/state/securityStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import type { Account } from '@/validation/accountSchema';

const PROVIDER_OPTIONS = PROVIDERS.map((provider) => ({ value: provider, label: PROVIDER_LABELS[provider] }));

export default function OnboardingScreen() {
  const addAccount = useAccountsStore((s) => s.addAccount);
  const setUsername = useSecurityStore((s) => s.setUsername);
  const [username, setUsernameInput] = useState('');
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<Account['provider'] | null>(null);
  const [balance, setBalance] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const canSubmit = name.trim().length > 0 && provider !== null && !submitting;

  async function handleCreate() {
    if (!provider) return;
    setSubmitting(true);
    try {
      if (username.trim()) {
        await setUsername(username.trim());
      }
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
      <View style={styles.logoWrap}>
        <Logo size={72} />
      </View>
      <Text style={styles.title}>Bienvenue sur MManagment</Text>
      <Text style={styles.subtitle}>Configure ton profil et ton premier compte pour commencer.</Text>

      <TextField label="Ton nom d'utilisateur (optionnel)" value={username} onChangeText={setUsernameInput} placeholder="Ex : Mirado" />

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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    logoWrap: {
      alignSelf: 'center',
      marginTop: spacing.xl,
    },
    title: {
      color: colors.gold[500],
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      textAlign: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: typography.size.md,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.sm,
    },
  });
}
