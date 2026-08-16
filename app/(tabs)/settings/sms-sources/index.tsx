import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, EmptyState, ListItem, Screen, Toggle } from '@/components/ui';
import { AUTO_CONFIRM_RELIABILITY_THRESHOLD, useSmsSettingsStore } from '@/state/smsSettingsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

const PROVIDER_LABELS: Record<string, string> = {
  mvola: 'MVola',
  airtel_money: 'Airtel Money',
  orange_money: 'Orange Money',
  bank: 'Banque',
};

export default function SmsSourcesScreen() {
  const detectionEnabled = useSmsSettingsStore((s) => s.detectionEnabled);
  const permissionGranted = useSmsSettingsStore((s) => s.permissionGranted);
  const setDetectionEnabled = useSmsSettingsStore((s) => s.setDetectionEnabled);
  const sources = useSmsSettingsStore((s) => s.sources);
  const reliabilityCounts = useSmsSettingsStore((s) => s.reliabilityCounts);
  const load = useSmsSettingsStore((s) => s.load);
  const setSourceEnabled = useSmsSettingsStore((s) => s.setSourceEnabled);
  const setSourceAutoConfirm = useSmsSettingsStore((s) => s.setSourceAutoConfirm);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen scroll>
      <Text style={styles.heading}>Sources SMS</Text>

      <Card style={styles.card}>
        <ListItem
          title="Détection SMS"
          subtitle="Analyser les SMS financiers autorisés"
          right={<Toggle value={detectionEnabled} onValueChange={(value) => void setDetectionEnabled(value)} />}
        />
      </Card>

      {detectionEnabled && !permissionGranted ? (
        <Text style={styles.warning}>
          Permission SMS refusée ou non accordée — la détection ne recevra rien tant que l'accès aux SMS n'est pas
          autorisé pour cette app dans les paramètres Android.
        </Text>
      ) : (
        <Text style={styles.hint}>
          Ajoutez ci-dessous les expéditeurs autorisés (MVola, Airtel Money, Orange Money, votre banque). Seuls les
          SMS provenant de ces expéditeurs exacts sont analysés.
        </Text>
      )}

      {sources.length === 0 ? (
        <Card style={styles.card}>
          <EmptyState title="Aucune source configurée" subtitle="Ajoutez MVola, Airtel Money, Orange Money ou votre banque." />
        </Card>
      ) : (
        sources.map((source) => {
          const reliableEnough = (reliabilityCounts[source.id] ?? 0) >= AUTO_CONFIRM_RELIABILITY_THRESHOLD;
          return (
            <Card key={source.id} style={styles.card}>
              <ListItem
                title={source.name}
                subtitle={`${PROVIDER_LABELS[source.provider] ?? source.provider} · ${source.senderPattern}`}
                right={<Toggle value={source.enabled} onValueChange={(value) => void setSourceEnabled(source.id, value)} />}
              />
              {reliableEnough ? (
                <ListItem
                  title="Auto-validation"
                  subtitle="Confirmer automatiquement les transactions détectées de cette source"
                  right={<Toggle value={source.autoConfirm} onValueChange={(value) => void setSourceAutoConfirm(source.id, value)} />}
                />
              ) : (
                <Text style={styles.reliabilityHint}>
                  Auto-validation disponible après {AUTO_CONFIRM_RELIABILITY_THRESHOLD} détections réussies
                  ({reliabilityCounts[source.id] ?? 0}/{AUTO_CONFIRM_RELIABILITY_THRESHOLD} pour l'instant).
                </Text>
              )}
            </Card>
          );
        })
      )}

      <Button label="+ Ajouter une source" onPress={() => router.push('/settings/sms-sources/new')} style={styles.newButton} />
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
    card: {
      marginBottom: spacing.md,
    },
    hint: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
      marginBottom: spacing.lg,
    },
    warning: {
      color: colors.semantic.warning,
      fontSize: typography.size.xs,
      marginBottom: spacing.lg,
    },
    reliabilityHint: {
      color: colors.text.muted,
      fontSize: typography.size.xs,
      marginTop: spacing.sm,
    },
    newButton: {
      marginTop: spacing.lg,
    },
  });
}
