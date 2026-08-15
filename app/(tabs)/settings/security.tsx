import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, Screen, TextField } from '@/components/ui';
import { pinService } from '@/services/security/pinService';
import { useSecurityStore } from '@/state/securityStore';
import { colors, spacing, typography } from '@/theme';

export default function SecuritySettingsScreen() {
  const hasPin = useSecurityStore((s) => s.hasPin);
  const biometricAvailable = useSecurityStore((s) => s.biometricAvailable);
  const checkStatus = useSecurityStore((s) => s.checkStatus);
  const setPinAction = useSecurityStore((s) => s.setPin);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  async function handleSetPin() {
    if (pin.length < 4) {
      setError('Le code PIN doit contenir au moins 4 chiffres');
      return;
    }
    if (pin !== confirmPin) {
      setError('Les deux codes ne correspondent pas');
      return;
    }
    setSubmitting(true);
    try {
      await setPinAction(pin);
      setPin('');
      setConfirmPin('');
      setError(undefined);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClearPin() {
    await pinService.clearPin();
    await checkStatus();
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Sécurité</Text>

      <Card style={styles.card}>
        <Text style={styles.status}>{hasPin ? 'Un code PIN est activé.' : 'Aucun code PIN défini.'}</Text>
        <Text style={styles.status}>
          {biometricAvailable ? 'Biométrie disponible sur cet appareil.' : 'Biométrie non disponible sur cet appareil.'}
        </Text>
      </Card>

      <TextField
        label={hasPin ? 'Nouveau code PIN' : 'Définir un code PIN'}
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
        error={error}
      />
      <TextField label="Confirmer le code PIN" value={confirmPin} onChangeText={setConfirmPin} secureTextEntry keyboardType="number-pad" />

      <Button
        label={hasPin ? 'Mettre à jour le code PIN' : 'Activer le code PIN'}
        onPress={() => void handleSetPin()}
        loading={submitting}
        disabled={!pin || !confirmPin}
      />

      {hasPin ? (
        <Button label="Désactiver le code PIN" variant="danger" onPress={() => void handleClearPin()} style={styles.clearButton} />
      ) : null}
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
  card: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  status: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
  },
  clearButton: {
    marginTop: spacing.lg,
  },
});
