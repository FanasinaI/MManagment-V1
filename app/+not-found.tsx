import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
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

const styles = StyleSheet.create({
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
