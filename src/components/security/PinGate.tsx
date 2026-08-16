import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/branding/Logo';
import { Button, Screen, TextField } from '@/components/ui';
import { useSecurityStore } from '@/state/securityStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export function PinGate() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const unlockWithPin = useSecurityStore((s) => s.unlockWithPin);
  const unlockWithBiometrics = useSecurityStore((s) => s.unlockWithBiometrics);
  const biometricAvailable = useSecurityStore((s) => s.biometricAvailable);
  const username = useSecurityStore((s) => s.username);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);
  const triedAutoBiometric = useRef(false);

  useEffect(() => {
    if (biometricAvailable && !triedAutoBiometric.current) {
      triedAutoBiometric.current = true;
      void unlockWithBiometrics();
    }
  }, [biometricAvailable, unlockWithBiometrics]);

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
        <View style={styles.logoWrap}>
          <Logo size={88} />
        </View>
        <Text style={styles.title}>{username ? `Bonjour, ${username}` : 'MManagment'}</Text>
        <Text style={styles.subtitle}>
          {biometricAvailable ? 'Déverrouille avec ta biométrie ou ton code PIN' : 'Entre ton code PIN'}
        </Text>

        {biometricAvailable ? (
          <Button label="Utiliser la biométrie" onPress={() => void unlockWithBiometrics()} style={styles.biometricButton} />
        ) : null}

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
        <Button
          label="Déverrouiller"
          variant={biometricAvailable ? 'secondary' : 'primary'}
          onPress={() => void handleUnlock()}
          disabled={pin.length === 0}
        />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
    },
    logoWrap: {
      alignSelf: 'center',
    },
    title: {
      color: colors.gold[500],
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      textAlign: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: typography.size.md,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    biometricButton: {
      alignSelf: 'stretch',
      marginBottom: spacing.lg,
    },
  });
}
