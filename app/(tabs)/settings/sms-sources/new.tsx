import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, Screen, TextField } from '@/components/ui';
import type { SmsProvider } from '@/domain/sms/types';
import { useAccountsStore } from '@/state/accountsStore';
import { useSmsSettingsStore } from '@/state/smsSettingsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

const PROVIDER_OPTIONS: { value: SmsProvider; label: string }[] = [
  { value: 'mvola', label: 'MVola' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'bank', label: 'Banque' },
];

export default function NewSmsSourceScreen() {
  const addSource = useSmsSettingsStore((s) => s.addSource);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<SmsProvider | null>(null);
  const [senderPattern, setSenderPattern] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const matchingAccounts = accounts.filter((a) => a.provider === provider);
  const canSubmit = name.trim().length > 0 && provider !== null && senderPattern.trim().length > 0 && !submitting;

  async function handleCreate() {
    if (!provider) return;
    setSubmitting(true);
    try {
      await addSource({ name: name.trim(), provider, senderPattern: senderPattern.trim(), enabled: true, accountId });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Ajouter une source SMS</Text>

      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex : BNI" />

      <Text style={styles.label}>Fournisseur</Text>
      <ChoiceChips
        options={PROVIDER_OPTIONS}
        value={provider}
        onChange={(value) => {
          setProvider(value);
          setAccountId(null);
        }}
      />

      <TextField
        label="Identifiant exact de l'expéditeur"
        value={senderPattern}
        onChangeText={setSenderPattern}
        placeholder="Ex : MVola ou BNI"
      />

      {provider ? (
        <>
          <Text style={styles.label}>Compte associé</Text>
          {matchingAccounts.length === 0 ? (
            <Text style={styles.hint}>
              Aucun compte de ce type pour l&apos;instant — créez-en un dans Comptes, sinon les transactions détectées
              ne pourront pas être rattachées.
            </Text>
          ) : matchingAccounts.length === 1 ? (
            <Text style={styles.hint}>
              Un seul compte {PROVIDER_OPTIONS.find((o) => o.value === provider)?.label} — les transactions détectées
              iront automatiquement vers &laquo; {matchingAccounts[0].name} &raquo;.
            </Text>
          ) : (
            <>
              <Text style={styles.hint}>
                Plusieurs comptes {PROVIDER_OPTIONS.find((o) => o.value === provider)?.label} — précise vers lequel
                envoyer les transactions détectées par cette source.
              </Text>
              <ChoiceChips
                options={matchingAccounts.map((a) => ({ value: a.id, label: a.name }))}
                value={accountId}
                onChange={setAccountId}
              />
            </>
          )}
        </>
      ) : null}

      <Button label="Ajouter" onPress={() => void handleCreate()} disabled={!canSubmit} loading={submitting} />
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
    hint: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
      marginBottom: spacing.lg,
    },
  });
}
