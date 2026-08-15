import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getRepositories } from '@/db/repositories';
import { colors } from '@/theme';

type Target = 'onboarding' | 'dashboard';

export default function Index() {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    (async () => {
      const { accounts } = await getRepositories();
      const list = await accounts.list();
      setTarget(list.length === 0 ? 'onboarding' : 'dashboard');
    })();
  }, []);

  if (!target) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold[500]} />
      </View>
    );
  }

  return <Redirect href={target === 'onboarding' ? '/onboarding' : '/(tabs)/dashboard'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
});
