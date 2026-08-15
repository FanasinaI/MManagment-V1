import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, ChoiceChips, Screen, TextField } from '@/components/ui';
import type { SmsProvider } from '@/domain/sms/types';
import { useSmsSettingsStore } from '@/state/smsSettingsStore';
import { colors, spacing, typography } from '@/theme';

const PROVIDER_OPTIONS: { value: SmsProvider; label: string }[] = [
  { value: 'mvola', label: 'MVola' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'bank', label: 'Banque' },
];

export default function NewSmsSourceScreen() {
  const addSource = useSmsSettingsStore((s) => s.addSource);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<SmsProvider | null>(null);
  const [senderPattern, setSenderPattern] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && provider !== null && senderPattern.trim().length > 0 && !submitting;

  async function handleCreate() {
    if (!provider) return;
    setSubmitting(true);
    try {
      await addSource({ name: name.trim(), provider, senderPattern: senderPattern.trim(), enabled: true });
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
      <ChoiceChips options={PROVIDER_OPTIONS} value={provider} onChange={setProvider} />

      <TextField
        label="Identifiant exact de l'expéditeur"
        value={senderPattern}
        onChangeText={setSenderPattern}
        placeholder="Ex : MVola ou BNI"
      />

      <Button label="Ajouter" onPress={() => void handleCreate()} disabled={!canSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
