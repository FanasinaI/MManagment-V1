import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/branding/Logo';
import { Button, Screen, TextField } from '@/components/ui';
import { appSettingsService } from '@/services/settings/appSettingsService';
import { useSecurityStore } from '@/state/securityStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function OnboardingScreen() {
  const setUsernameAction = useSecurityStore((s) => s.setUsername);
  const setPinAction = useSecurityStore((s) => s.setPin);
  const biometricAvailable = useSecurityStore((s) => s.biometricAvailable);
  const unlockWithBiometrics = useSecurityStore((s) => s.unlockWithBiometrics);

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'ok' | 'failed'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const canSubmit = username.trim().length > 0 && pin.length >= 4 && confirmPin.length >= 4 && !submitting;

  async function handleTestBiometric() {
    const ok = await unlockWithBiometrics();
    setBiometricStatus(ok ? 'ok' : 'failed');
  }

  async function handleFinish() {
    if (pin !== confirmPin) {
      setError('Les deux codes ne correspondent pas');
      return;
    }
    if (pin.length < 4) {
      setError('Le code PIN doit contenir au moins 4 chiffres');
      return;
    }
    setSubmitting(true);
    try {
      await setUsernameAction(username.trim());
      await setPinAction(pin);
      await appSettingsService.setOnboardingCompleted(true);
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
      <Text style={styles.subtitle}>Choisis un nom d'utilisateur et un code PIN pour protéger tes données.</Text>

      <TextField label="Nom d'utilisateur" value={username} onChangeText={setUsername} placeholder="Ex : Mirado" autoCapitalize="words" />

      <TextField
        label="Code PIN"
        value={pin}
        onChangeText={(v) => {
          setError(undefined);
          setPin(v);
        }}
        secureTextEntry
        keyboardType="number-pad"
      />
      <TextField
        label="Confirmer le code PIN"
        value={confirmPin}
        onChangeText={(v) => {
          setError(undefined);
          setConfirmPin(v);
        }}
        secureTextEntry
        keyboardType="number-pad"
        error={error}
      />

      {biometricAvailable ? (
        <View style={styles.biometricBlock}>
          <Button label="Tester la biométrie" variant="secondary" onPress={() => void handleTestBiometric()} />
          {biometricStatus === 'ok' ? <Text style={styles.biometricOk}>Biométrie reconnue ✓</Text> : null}
          {biometricStatus === 'failed' ? <Text style={styles.biometricFailed}>Non reconnue — le code PIN restera disponible.</Text> : null}
        </View>
      ) : null}

      <Button label="Terminer" onPress={() => void handleFinish()} disabled={!canSubmit} loading={submitting} style={styles.finishButton} />
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
    biometricBlock: {
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    biometricOk: {
      color: colors.semantic.income,
      fontSize: typography.size.sm,
      textAlign: 'center',
    },
    biometricFailed: {
      color: colors.text.muted,
      fontSize: typography.size.sm,
      textAlign: 'center',
    },
    finishButton: {
      marginTop: spacing.md,
    },
  });
}
