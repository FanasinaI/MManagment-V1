import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { getDb } from '@/db/client';
import { getRepositories } from '@/db/repositories';
import { restoreDatabase } from '@/db/restore';
import { decryptJson, encryptJson, generateBackupKeyHex } from '@/domain/backup/crypto';
import { exportEncryptedBackup, type BackupSource } from '@/domain/backup/exportBackup';
import { importEncryptedBackup, InvalidBackupError } from '@/domain/backup/importBackup';
import { useAccountsStore } from '@/state/accountsStore';
import { useBudgetsStore } from '@/state/budgetsStore';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useGoalsStore } from '@/state/goalsStore';
import { useSavingsStore } from '@/state/savingsStore';
import { useSmsSettingsStore } from '@/state/smsSettingsStore';
import { useThemeStore } from '@/state/themeStore';
import { useTransactionsStore } from '@/state/transactionsStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import type { BackupPayload } from '@/validation/backupSchema';

const BACKUP_KEY_STORAGE = 'mm_backup_key_hex';

async function getOrCreateBackupKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(BACKUP_KEY_STORAGE);
  if (existing) return existing;
  const generated = await generateBackupKeyHex();
  await SecureStore.setItemAsync(BACKUP_KEY_STORAGE, generated);
  return generated;
}

async function reloadAllStores(): Promise<void> {
  await Promise.all([
    useAccountsStore.getState().load(),
    useTransactionsStore.getState().load(),
    useTransactionsStore.getState().loadPending(),
    useCategoriesStore.getState().load(),
    useBudgetsStore.getState().load(),
    useSavingsStore.getState().load(),
    useGoalsStore.getState().load(),
    useSmsSettingsStore.getState().load(),
  ]);
}

export default function BackupSettingsScreen() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<BackupPayload | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  async function handleExport() {
    setBusy(true);
    setStatus(null);
    setPendingPayload(null);
    try {
      const repos = await getRepositories();
      const source: BackupSource = {
        getAccounts: () => repos.accounts.list(),
        getTransactions: () => repos.transactions.list(),
        getCategories: () => repos.categories.list(),
        getBudgets: () => repos.budgets.list(),
        getSavings: () => repos.savings.list(),
        getGoals: () => repos.goals.list(),
        getSmsSources: () => repos.smsSources.list(),
        getAlerts: () => repos.alerts.list(),
      };
      const keyHex = await getOrCreateBackupKey();
      const ciphertext = await exportEncryptedBackup(source, (json) => encryptJson(json, keyHex));

      const fileName = `mmanagment-${new Date().toISOString().slice(0, 10)}.mmbak`;
      const file = new File(Paths.document, fileName);
      if (file.exists) file.delete();
      file.create();
      file.write(ciphertext);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      }
      setStatus(`Sauvegarde créée : ${fileName}`);
    } catch {
      setStatus("Échec de l'export de la sauvegarde.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePickAndValidate() {
    setBusy(true);
    setStatus(null);
    setPendingPayload(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || result.assets.length === 0) return;

      const file = new File(result.assets[0].uri);
      const ciphertext = await file.text();
      const keyHex = await getOrCreateBackupKey();
      const payload = await importEncryptedBackup(ciphertext, (data) => decryptJson(data, keyHex));

      setPendingPayload(payload);
      setStatus(
        `Sauvegarde valide : ${payload.accounts.length} compte(s), ${payload.transactions.length} transaction(s), datée du ${new Date(payload.exportedAt).toLocaleDateString('fr-FR')}.`
      );
    } catch (error) {
      setStatus(error instanceof InvalidBackupError ? error.message : "Échec de l'import de la sauvegarde.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmRestore() {
    if (!pendingPayload) return;
    setBusy(true);
    try {
      const db = await getDb();
      await restoreDatabase(db, pendingPayload);
      await reloadAllStores();
      setPendingPayload(null);
      setStatus('Données restaurées avec succès.');
    } catch {
      setStatus('Échec de la restauration — vos données précédentes sont conservées si la transaction a échoué avant la fin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Sauvegarde</Text>
      <Card style={styles.card}>
        <Text style={styles.description}>
          Exportez une sauvegarde chiffrée (.mmbak) de toutes vos données locales, à conserver sur Google Drive, votre PC ou
          un autre support.
        </Text>
        <Button label="Exporter une sauvegarde" onPress={() => void handleExport()} loading={busy} style={styles.button} />
        <Button
          label="Importer une sauvegarde"
          variant="secondary"
          onPress={() => void handlePickAndValidate()}
          loading={busy}
          style={styles.button}
        />
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {pendingPayload ? (
          <View style={styles.confirmBlock}>
            <Text style={styles.warning}>
              Restaurer remplacera toutes les données actuelles de l&apos;application par celles de cette sauvegarde. Cette
              action est irréversible.
            </Text>
            <Button label="Confirmer le remplacement" variant="danger" onPress={() => void handleConfirmRestore()} loading={busy} />
            <Button label="Annuler" variant="ghost" onPress={() => setPendingPayload(null)} disabled={busy} />
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
      gap: spacing.md,
    },
    description: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
    },
    button: {
      marginTop: spacing.xs,
    },
    status: {
      color: colors.text.primary,
      fontSize: typography.size.sm,
      marginTop: spacing.sm,
    },
    confirmBlock: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    warning: {
      color: colors.semantic.warning,
      fontSize: typography.size.xs,
    },
  });
}
