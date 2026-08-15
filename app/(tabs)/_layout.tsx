import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { colors } from '@/theme';

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>;
}

export default function TabsLayout() {
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
        options={{ title: 'Tableau de bord', tabBarIcon: ({ color }) => <TabIcon symbol="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{ title: 'Transactions', tabBarIcon: ({ color }) => <TabIcon symbol="💳" color={color} /> }}
      />
      <Tabs.Screen
        name="budgets/index"
        options={{ title: 'Budgets', tabBarIcon: ({ color }) => <TabIcon symbol="📊" color={color} /> }}
      />
      <Tabs.Screen
        name="savings/index"
        options={{ title: 'Épargne', tabBarIcon: ({ color }) => <TabIcon symbol="🏦" color={color} /> }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{ title: 'Paramètres', tabBarIcon: ({ color }) => <TabIcon symbol="⚙️" color={color} /> }}
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
      <Tabs.Screen name="settings/sms-sources/index" options={{ href: null, title: 'Sources SMS' }} />
      <Tabs.Screen name="settings/sms-sources/new" options={{ href: null, title: 'Ajouter une source' }} />
    </Tabs>
  );
}
