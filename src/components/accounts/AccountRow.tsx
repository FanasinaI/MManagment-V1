import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountIcon } from '@/components/dashboard/AccountIcon';
import { PROVIDER_LABELS } from '@/domain/finance/accountProvider';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';
import { formatMoney } from '@/utils/money';
import type { Account } from '@/validation/accountSchema';

interface AccountRowProps {
  account: Account;
  isFirst: boolean;
  isLast: boolean;
  onSetDefault: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * A plain ListItem can't host this row's star/reorder controls without
 * nesting a Pressable inside its own onPress-wrapped row (double-trigger
 * risk), so navigation is scoped to the name/icon area only, with the
 * controls as independent siblings.
 */
export function AccountRow({ account, isFirst, isLast, onSetDefault, onMoveUp, onMoveDown }: AccountRowProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <Pressable style={styles.main} onPress={() => router.push(`/accounts/${account.id}`)}>
        <AccountIcon provider={account.provider} />
        <View style={styles.textColumn}>
          <View style={styles.nameRow}>
            <Text style={styles.title}>{account.name}</Text>
            {account.isDefault ? <Ionicons name="star" size={13} color={colors.gold[500]} style={styles.starBadge} /> : null}
          </View>
          <Text style={styles.subtitle}>{PROVIDER_LABELS[account.provider]}</Text>
        </View>
      </Pressable>
      <View style={styles.rightColumn}>
        <Text style={styles.balance}>{formatMoney(account.balance, account.currency)}</Text>
        <View style={styles.controls}>
          <Pressable onPress={onSetDefault} hitSlop={8}>
            <Ionicons
              name={account.isDefault ? 'star' : 'star-outline'}
              size={16}
              color={account.isDefault ? colors.gold[500] : colors.text.muted}
            />
          </Pressable>
          <Pressable onPress={onMoveUp} disabled={isFirst} hitSlop={8}>
            <Ionicons name="chevron-up" size={16} color={isFirst ? colors.border : colors.text.secondary} />
          </Pressable>
          <Pressable onPress={onMoveDown} disabled={isLast} hitSlop={8}>
            <Ionicons name="chevron-down" size={16} color={isLast ? colors.border : colors.text.secondary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },
    main: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.md,
    },
    textColumn: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    starBadge: {
      marginLeft: spacing.xs,
    },
    title: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.medium,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginTop: 2,
    },
    rightColumn: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    balance: {
      color: colors.text.primary,
      fontWeight: typography.weight.medium,
    },
    controls: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
}
