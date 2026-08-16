import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, ListItem, Screen, TextField, Toggle } from '@/components/ui';
import { useAlertsStore } from '@/state/alertsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import type { Alert } from '@/validation/backupSchema';

export default function AlertsSettingsScreen() {
  const alerts = useAlertsStore((s) => s.alerts);
  const load = useAlertsStore((s) => s.load);
  const setAlert = useAlertsStore((s) => s.setAlert);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('10000');
  const [reminderDay, setReminderDay] = useState('25');

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const lowBalance = alerts.find((a) => a.type === 'low_balance');
    if (lowBalance?.threshold != null) setLowBalanceThreshold(String(lowBalance.threshold));
    const reminder = alerts.find((a) => a.type === 'savings_reminder');
    if (reminder?.threshold != null) setReminderDay(String(reminder.threshold));
  }, [alerts]);

  function isEnabled(type: Alert['type']): boolean {
    return alerts.find((a) => a.type === type)?.enabled ?? false;
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Alertes</Text>

      <Card style={styles.card}>
        <ListItem
          title="Budget à 80%"
          subtitle="Prévenir quand un budget approche sa limite"
          right={<Toggle value={isEnabled('budget_80')} onValueChange={(v) => void setAlert('budget_80', v)} />}
        />
        <ListItem
          title="Budget dépassé"
          subtitle="Prévenir quand un budget est dépassé"
          right={<Toggle value={isEnabled('budget_100')} onValueChange={(v) => void setAlert('budget_100', v)} />}
        />
        <ListItem
          title="Objectif proche"
          subtitle="Prévenir quand un objectif approche (90% ou échéance à 7 jours)"
          right={<Toggle value={isEnabled('goal_near')} onValueChange={(v) => void setAlert('goal_near', v)} />}
        />
      </Card>

      <Card style={styles.card}>
        <ListItem
          title="Solde faible"
          subtitle="Prévenir sous un certain seuil"
          right={<Toggle value={isEnabled('low_balance')} onValueChange={(v) => void setAlert('low_balance', v, Number.parseFloat(lowBalanceThreshold) || 0)} />}
        />
        {isEnabled('low_balance') ? (
          <View style={styles.thresholdRow}>
            <TextField
              label="Seuil (Ar)"
              value={lowBalanceThreshold}
              onChangeText={setLowBalanceThreshold}
              keyboardType="numeric"
              placeholder="10000"
            />
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <ListItem
          title="Rappel d'épargne mensuel"
          subtitle="Notification locale programmée chaque mois"
          right={<Toggle value={isEnabled('savings_reminder')} onValueChange={(v) => void setAlert('savings_reminder', v, Number.parseInt(reminderDay, 10) || 25)} />}
        />
        {isEnabled('savings_reminder') ? (
          <View style={styles.thresholdRow}>
            <TextField label="Jour du mois" value={reminderDay} onChangeText={setReminderDay} keyboardType="numeric" placeholder="25" />
          </View>
        ) : null}
      </Card>
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
      marginBottom: spacing.lg,
    },
    thresholdRow: {
      marginTop: spacing.md,
    },
  });
}
