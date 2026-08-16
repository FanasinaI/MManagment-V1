import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { getRepositories } from '@/db/repositories';
import { buildWorkbook, workbookToBytes } from '@/domain/export/excelExport';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function ExportExcelScreen() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  async function handleExport() {
    setBusy(true);
    setStatus(null);
    try {
      const repos = await getRepositories();
      const [accounts, transactions, categories, budgets, savings, goals] = await Promise.all([
        repos.accounts.list(),
        repos.transactions.list(),
        repos.categories.list(),
        repos.budgets.list(),
        repos.savings.list(),
        repos.goals.list(),
      ]);

      const workbook = buildWorkbook({ accounts, transactions, categories, budgets, savings, goals });
      const bytes = workbookToBytes(workbook);

      const fileName = `mmanagment-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const file = new File(Paths.document, fileName);
      if (file.exists) file.delete();
      file.create();
      file.write(bytes);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Exporter MManagment (.xlsx)',
        });
      }
      setStatus(`Fichier généré : ${fileName}`);
    } catch {
      setStatus("Échec de l'export Excel.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Export Excel</Text>
      <Card style={styles.card}>
        <Text style={styles.description}>
          Génère un fichier .xlsx détaillé (Résumé, Comptes, Transactions, Budgets, Épargne, Objectifs) que tu peux
          ouvrir dans Excel, Google Sheets ou tout tableur. Contrairement à la sauvegarde chiffrée, ce fichier est en
          clair — pratique à partager (comptable, archivage personnel), mais à ne pas envoyer n'importe où.
        </Text>
        <Button label="Exporter en Excel" onPress={() => void handleExport()} loading={busy} style={styles.button} />
        {status ? <Text style={styles.status}>{status}</Text> : null}
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
  });
}
