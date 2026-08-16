import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, Screen, TextField } from '@/components/ui';
import { PROVIDER_LABELS, PROVIDER_TO_TYPE, PROVIDERS } from '@/domain/finance/accountProvider';
import { useAccountsStore } from '@/state/accountsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import type { Account } from '@/validation/accountSchema';

const PROVIDER_OPTIONS = PROVIDERS.map((provider) => ({ value: provider, label: PROVIDER_LABELS[provider] }));

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useAccountsStore((s) => s.accounts.find((a) => a.id === id));
  const updateAccount = useAccountsStore((s) => s.updateAccount);
  const removeAccount = useAccountsStore((s) => s.removeAccount);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [provider, setProvider] = useState<Account['provider'] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setProvider(account.provider);
    }
  }, [account]);

  if (!account) {
    return (
      <Screen>
        <Text style={styles.notFound}>Compte introuvable.</Text>
      </Screen>
    );
  }

  const canSubmit = name.trim().length > 0 && provider !== null && !submitting;

  async function handleSave() {
    if (!provider) return;
    setSubmitting(true);
    try {
      await updateAccount(account!.id, { name: name.trim(), provider, type: PROVIDER_TO_TYPE[provider], currency: account!.currency });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await removeAccount(account!.id);
      router.replace('/accounts');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Modifier le compte</Text>

      <TextField label="Nom du compte" value={name} onChangeText={setName} placeholder="Ex : Livret A" />

      <Text style={styles.label}>Type de compte</Text>
      <ChoiceChips options={PROVIDER_OPTIONS} value={provider} onChange={setProvider} />

      <Button label="Enregistrer" onPress={() => void handleSave()} disabled={!canSubmit} loading={submitting} />

      {confirmingDelete ? (
        <>
          <Text style={styles.warning}>
            Supprimer ce compte supprimera aussi toutes ses transactions associées. Cette action est irréversible.
          </Text>
          <Button label="Confirmer la suppression" variant="danger" onPress={() => void handleDelete()} loading={submitting} style={styles.deleteButton} />
          <Button label="Annuler" variant="ghost" onPress={() => setConfirmingDelete(false)} disabled={submitting} />
        </>
      ) : (
        <Button label="Supprimer ce compte" variant="danger" onPress={() => setConfirmingDelete(true)} style={styles.deleteButton} />
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
