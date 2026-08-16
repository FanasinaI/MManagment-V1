import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface QuickAction {
  label: string;
  subtitle: string;
  icon: IconName;
  pathname: string;
  params?: Record<string, string>;
}

const ACTIONS: QuickAction[] = [
  { label: 'Transaction', subtitle: 'Revenu, dépense, frais…', icon: 'card', pathname: '/transactions/new' },
  { label: 'Transfert entre comptes', subtitle: 'Déplacer de l’argent d’un compte à un autre', icon: 'swap-horizontal', pathname: '/transactions/new', params: { type: 'transfer' } },
  { label: 'Compte', subtitle: 'MVola, banque, espèces…', icon: 'wallet', pathname: '/accounts/new' },
  { label: 'Objectif', subtitle: 'Fixer un montant cible', icon: 'flag', pathname: '/savings/goals-new' },
  { label: "Poche d'épargne", subtitle: 'Mettre de l’argent de côté', icon: 'save', pathname: '/savings/new' },
  { label: 'Budget', subtitle: 'Limiter une catégorie', icon: 'pie-chart', pathname: '/budgets/new' },
];

export default function QuickAddScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  return (
    <Screen scroll>
      <Text style={styles.heading}>Ajouter</Text>
      {ACTIONS.map((action) => (
        <Card key={action.label} style={styles.card}>
          <Pressable style={styles.row} onPress={() => router.push({ pathname: action.pathname, params: action.params })}>
            <View style={styles.iconWrap}>
              <Ionicons name={action.icon} size={22} color={colors.gold[500]} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>{action.label}</Text>
              <Text style={styles.subtitle}>{action.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </Pressable>
        </Card>
      ))}
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
      padding: 0,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.gold[500]}26`,
    },
    textColumn: {
      flex: 1,
    },
    label: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginTop: 2,
    },
  });
}
