import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function NotFoundScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  return (
    <>
      <Stack.Screen options={{ title: 'Introuvable' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Cette page n&apos;existe pas.</Text>
        <Link href="/" style={styles.link}>
          Retour à l&apos;accueil
        </Link>
      </View>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.primary,
      padding: spacing.lg,
    },
    title: {
      color: colors.text.primary,
      fontSize: typography.size.md,
      marginBottom: spacing.lg,
    },
    link: {
      color: colors.gold[500],
      fontSize: typography.size.md,
    },
  });
}
