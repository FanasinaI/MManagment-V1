import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen, TextField } from '@/components/ui';
import { useSecurityStore } from '@/state/securityStore';
import { colors, spacing, typography } from '@/theme';

export function PinGate() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const unlockWithPin = useSecurityStore((s) => s.unlockWithPin);
  const unlockWithBiometrics = useSecurityStore((s) => s.unlockWithBiometrics);
  const biometricAvailable = useSecurityStore((s) => s.biometricAvailable);

  async function handleUnlock() {
    const ok = await unlockWithPin(pin);
    if (!ok) {
      setError('Code PIN incorrect');
      setPin('');
    }
  }

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.title}>MManagment</Text>
        <Text style={styles.subtitle}>Entrez votre code PIN</Text>
        <TextField
          label="Code PIN"
          value={pin}
          onChangeText={(value) => {
            setError(undefined);
            setPin(value);
          }}
          secureTextEntry
          keyboardType="number-pad"
          error={error}
        />
        <Button label="Déverrouiller" onPress={() => void handleUnlock()} disabled={pin.length === 0} />
        {biometricAvailable ? (
          <View style={styles.biometricButton}>
            <Button label="Utiliser la biométrie" variant="secondary" onPress={() => void unlockWithBiometrics()} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.gold[500],
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  biometricButton: {
    marginTop: spacing.md,
  },
});
