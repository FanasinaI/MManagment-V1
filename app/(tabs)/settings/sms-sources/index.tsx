import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, EmptyState, ListItem, Screen, Toggle } from '@/components/ui';
import { useSmsSettingsStore } from '@/state/smsSettingsStore';
import { colors, spacing, typography } from '@/theme';

const PROVIDER_LABELS: Record<string, string> = {
  mvola: 'MVola',
  airtel_money: 'Airtel Money',
  orange_money: 'Orange Money',
  bank: 'Banque',
};

export default function SmsSourcesScreen() {
  const detectionEnabled = useSmsSettingsStore((s) => s.detectionEnabled);
  const setDetectionEnabled = useSmsSettingsStore((s) => s.setDetectionEnabled);
  const sources = useSmsSettingsStore((s) => s.sources);
  const load = useSmsSettingsStore((s) => s.load);
  const setSourceEnabled = useSmsSettingsStore((s) => s.setSourceEnabled);

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

      <Text style={styles.hint}>
        La réception automatique des SMS nécessite un module Android natif non disponible dans cette build de
        développement (voir CLAUDE.md, P5). Les réglages ci-dessous préparent la configuration pour quand il sera prêt.
      </Text>

      <Card style={styles.card}>
        {sources.length === 0 ? (
          <EmptyState title="Aucune source configurée" subtitle="Ajoutez MVola, Airtel Money, Orange Money ou votre banque." />
        ) : (
          sources.map((source) => (
            <ListItem
              key={source.id}
              title={source.name}
              subtitle={`${PROVIDER_LABELS[source.provider] ?? source.provider} · ${source.senderPattern}`}
              right={<Toggle value={source.enabled} onValueChange={(value) => void setSourceEnabled(source.id, value)} />}
            />
          ))
        )}
      </Card>

      <Button label="+ Ajouter une source" onPress={() => router.push('/settings/sms-sources/new')} style={styles.newButton} />
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
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginBottom: spacing.lg,
  },
  newButton: {
    marginTop: spacing.lg,
  },
});
