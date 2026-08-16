import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, Screen, TextField } from '@/components/ui';
import { pinService } from '@/services/security/pinService';
import { useSecurityStore } from '@/state/securityStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function SecuritySettingsScreen() {
  const hasPin = useSecurityStore((s) => s.hasPin);
  const biometricAvailable = useSecurityStore((s) => s.biometricAvailable);
  const username = useSecurityStore((s) => s.username);
  const checkStatus = useSecurityStore((s) => s.checkStatus);
  const setPinAction = useSecurityStore((s) => s.setPin);
  const setUsernameAction = useSecurityStore((s) => s.setUsername);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    setUsernameInput(username ?? '');
  }, [username]);

  async function handleSaveUsername() {
    if (!usernameInput.trim()) return;
    await setUsernameAction(usernameInput.trim());
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  }

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

      <Text style={styles.sectionTitle}>Profil</Text>
      <TextField label="Nom d'utilisateur" value={usernameInput} onChangeText={setUsernameInput} placeholder="Ton prénom" />
      <Button
        label={usernameSaved ? 'Enregistré ✓' : "Enregistrer le nom d'utilisateur"}
        variant="secondary"
        onPress={() => void handleSaveUsername()}
        disabled={!usernameInput.trim()}
        style={styles.section}
      />

      <Text style={styles.sectionTitle}>Déverrouillage</Text>
      <Card style={styles.card}>
        <Text style={styles.status}>{hasPin ? 'Un code PIN est activé.' : 'Aucun code PIN défini.'}</Text>
        <Text style={styles.status}>
          {biometricAvailable
            ? 'Biométrie disponible — utilisée en priorité au démarrage.'
            : 'Biométrie non disponible sur cet appareil.'}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    heading: {
      color: colors.text.primary,
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      marginBottom: spacing.md,
    },
    section: {
      marginBottom: spacing.xl,
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
}
