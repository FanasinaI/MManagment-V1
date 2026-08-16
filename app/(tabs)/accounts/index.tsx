import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AccountRow } from '@/components/accounts/AccountRow';
import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { useAccountsStore } from '@/state/accountsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function AccountsScreen() {
  const accounts = useAccountsStore((s) => s.accounts);
  const load = useAccountsStore((s) => s.load);
  const setDefaultAccount = useAccountsStore((s) => s.setDefaultAccount);
  const reorderAccounts = useAccountsStore((s) => s.reorderAccounts);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void load();
  }, [load]);

  function moveAccount(id: string, direction: -1 | 1) {
    const index = accounts.findIndex((a) => a.id === id);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= accounts.length) return;
    const reordered = [...accounts];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    void reorderAccounts(reordered.map((a) => a.id));
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Comptes</Text>

      <Card>
        {accounts.length === 0 ? (
          <EmptyState title="Aucun compte" subtitle="Ajoutez votre premier compte pour suivre vos finances." />
        ) : (
          accounts.map((account, index) => (
            <AccountRow
              key={account.id}
              account={account}
              isFirst={index === 0}
              isLast={index === accounts.length - 1}
              onSetDefault={() => void setDefaultAccount(account.id)}
              onMoveUp={() => moveAccount(account.id, -1)}
              onMoveDown={() => moveAccount(account.id, 1)}
            />
          ))
        )}
      </Card>

      <Button label="Ajouter un compte" onPress={() => router.push('/accounts/new')} style={styles.addButton} />
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
    addButton: {
      marginTop: spacing.lg,
    },
  });
}
