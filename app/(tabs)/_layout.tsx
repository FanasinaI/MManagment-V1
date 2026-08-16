import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useThemeStore } from '@/state/themeStore';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IconName, filled: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? filled : outline} color={color as string} size={size} />
  );
}

export default function TabsLayout() {
  const colors = useThemeStore((s) => s.colors);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background.primary },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.background.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.gold[500],
        tabBarInactiveTintColor: colors.text.muted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Tableau de bord', tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{ title: 'Transactions', tabBarIcon: tabIcon('card-outline', 'card') }}
      />
      <Tabs.Screen
        name="budgets/index"
        options={{ title: 'Budgets', tabBarIcon: tabIcon('pie-chart-outline', 'pie-chart') }}
      />
      <Tabs.Screen
        name="savings/index"
        options={{ title: 'Épargne', tabBarIcon: tabIcon('wallet-outline', 'wallet') }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{ title: 'Paramètres', tabBarIcon: tabIcon('settings-outline', 'settings') }}
      />

      {/* Routes reachable by navigation but not shown in the tab bar */}
      <Tabs.Screen name="accounts/index" options={{ href: null, title: 'Comptes' }} />
      <Tabs.Screen name="accounts/new" options={{ href: null, title: 'Nouveau compte' }} />
      <Tabs.Screen name="transactions/new" options={{ href: null, title: 'Nouvelle transaction' }} />
      <Tabs.Screen name="transactions/[id]" options={{ href: null, title: 'Transaction' }} />
      <Tabs.Screen name="transactions/pending" options={{ href: null, title: 'En attente' }} />
      <Tabs.Screen name="budgets/new" options={{ href: null, title: 'Nouveau budget' }} />
      <Tabs.Screen name="savings/new" options={{ href: null, title: 'Nouvelle poche' }} />
      <Tabs.Screen name="savings/goals" options={{ href: null, title: 'Objectifs' }} />
      <Tabs.Screen name="savings/goals-new" options={{ href: null, title: 'Nouvel objectif' }} />
      <Tabs.Screen name="settings/security" options={{ href: null, title: 'Sécurité' }} />
      <Tabs.Screen name="settings/backup" options={{ href: null, title: 'Sauvegarde' }} />
      <Tabs.Screen name="settings/export" options={{ href: null, title: 'Export Excel' }} />
      <Tabs.Screen name="settings/sms-sources/index" options={{ href: null, title: 'Sources SMS' }} />
      <Tabs.Screen name="settings/sms-sources/new" options={{ href: null, title: 'Ajouter une source' }} />
    </Tabs>
  );
}
