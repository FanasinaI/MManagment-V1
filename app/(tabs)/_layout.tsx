import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { GestureResponderEvent, ColorValue } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import type { ThemeColors } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IconName, filled: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? filled : outline} color={color as string} size={size} />
  );
}

interface FabTabButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
}

function FabTabButton({ onPress }: FabTabButtonProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = createFabStyles(colors);
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.text.onGold} />
      </Pressable>
    </View>
  );
}

function createFabStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.gold[500],
      marginBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
  });
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
      <Tabs.Screen name="dashboard" options={{ title: 'Accueil', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen
        name="transactions/index"
        options={{ title: 'Transactions', tabBarIcon: tabIcon('card-outline', 'card') }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: (props) => <FabTabButton onPress={props.onPress} />,
        }}
      />
      <Tabs.Screen name="savings/goals/index" options={{ title: 'Objectifs', tabBarIcon: tabIcon('flag-outline', 'flag') }} />
      <Tabs.Screen
        name="settings/index"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person-outline', 'person') }}
      />

      {/* Routes reachable by navigation but not shown in the tab bar */}
      <Tabs.Screen name="accounts/index" options={{ href: null, title: 'Comptes' }} />
      <Tabs.Screen name="accounts/new" options={{ href: null, title: 'Nouveau compte' }} />
      <Tabs.Screen name="accounts/[id]" options={{ href: null, title: 'Modifier le compte' }} />
      <Tabs.Screen name="transactions/new" options={{ href: null, title: 'Nouvelle transaction' }} />
      <Tabs.Screen name="transactions/[id]" options={{ href: null, title: 'Transaction' }} />
      <Tabs.Screen name="transactions/pending" options={{ href: null, title: 'En attente' }} />
      <Tabs.Screen name="budgets/index" options={{ href: null, title: 'Budgets' }} />
      <Tabs.Screen name="budgets/new" options={{ href: null, title: 'Nouveau budget' }} />
      <Tabs.Screen name="savings/index" options={{ href: null, title: 'Épargne' }} />
      <Tabs.Screen name="savings/new" options={{ href: null, title: 'Nouvelle poche' }} />
      <Tabs.Screen name="savings/[id]" options={{ href: null, title: 'Modifier la poche' }} />
      <Tabs.Screen name="savings/goals/new" options={{ href: null, title: 'Nouvel objectif' }} />
      <Tabs.Screen name="savings/goals/[id]" options={{ href: null, title: "Modifier l'objectif" }} />
      <Tabs.Screen name="budgets/[id]" options={{ href: null, title: 'Modifier le budget' }} />
      <Tabs.Screen name="settings/categories/[id]" options={{ href: null, title: 'Modifier la catégorie' }} />
      <Tabs.Screen name="stats" options={{ href: null, title: 'Statistiques' }} />
      <Tabs.Screen name="settings/security" options={{ href: null, title: 'Sécurité' }} />
      <Tabs.Screen name="settings/alerts" options={{ href: null, title: 'Alertes' }} />
      <Tabs.Screen name="settings/backup" options={{ href: null, title: 'Sauvegarde' }} />
      <Tabs.Screen name="settings/export" options={{ href: null, title: 'Export Excel' }} />
      <Tabs.Screen name="settings/sms-sources/index" options={{ href: null, title: 'Sources SMS' }} />
      <Tabs.Screen name="settings/sms-sources/new" options={{ href: null, title: 'Ajouter une source' }} />
    </Tabs>
  );
}
