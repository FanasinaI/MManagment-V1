import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AccountIcon } from '@/components/dashboard/AccountIcon';
import { Button, Card, EmptyState, ListItem, Screen } from '@/components/ui';
import { PROVIDER_LABELS } from '@/domain/finance/accountProvider';
import { useAccountsStore } from '@/state/accountsStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatMoney } from '@/utils/money';

export default function AccountsScreen() {
  const accounts = useAccountsStore((s) => s.accounts);
  const load = useAccountsStore((s) => s.load);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen scroll>
      <Text style={styles.heading}>Comptes</Text>

      <Card>
        {accounts.length === 0 ? (
          <EmptyState title="Aucun compte" subtitle="Ajoutez votre premier compte pour suivre vos finances." />
        ) : (
          accounts.map((account) => (
            <ListItem
              key={account.id}
              title={account.name}
              subtitle={PROVIDER_LABELS[account.provider]}
              left={<AccountIcon provider={account.provider} />}
              right={<Text style={styles.balance}>{formatMoney(account.balance, account.currency)}</Text>}
              onPress={() => router.push(`/accounts/${account.id}`)}
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
    balance: {
      color: colors.text.primary,
      fontWeight: typography.weight.medium,
    },
    addButton: {
      marginTop: spacing.lg,
    },
  });
}
