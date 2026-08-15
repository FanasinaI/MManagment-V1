import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ListItem, Screen, TextField } from '@/components/ui';
import { useCategoriesStore } from '@/state/categoriesStore';
import { colors, spacing, typography } from '@/theme';

export default function SettingsScreen() {
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const [newCategory, setNewCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    setSubmitting(true);
    try {
      await addCategory({ name: newCategory.trim() });
      setNewCategory('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Paramètres</Text>

      <Card style={styles.card}>
        <ListItem title="Sécurité" subtitle="Code PIN, biométrie" onPress={() => router.push('/settings/security')} />
        <ListItem
          title="Sources SMS"
          subtitle="Détection des transactions financières"
          onPress={() => router.push('/settings/sms-sources')}
        />
        <ListItem title="Sauvegarde" subtitle="Exporter / importer vos données" onPress={() => router.push('/settings/backup')} />
      </Card>

      <Text style={styles.sectionTitle}>Catégories</Text>
      <Card style={styles.card}>
        {categories.length === 0 ? (
          <Text style={styles.hint}>Aucune catégorie pour le moment.</Text>
        ) : (
          categories.map((category) => <ListItem key={category.id} title={category.name} />)
        )}
      </Card>
      <View style={styles.addCategoryRow}>
        <View style={styles.addCategoryInput}>
          <TextField label="Nouvelle catégorie" value={newCategory} onChangeText={setNewCategory} placeholder="Ex : Alimentation" />
        </View>
        <Button
          label="Ajouter"
          onPress={() => void handleAddCategory()}
          loading={submitting}
          disabled={!newCategory.trim()}
          style={styles.addCategoryButton}
        />
      </View>

      <Text style={styles.version}>MManagment v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text.primary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.text.muted,
    fontSize: typography.size.sm,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addCategoryInput: {
    flex: 1,
  },
  addCategoryButton: {
    marginTop: spacing.lg,
  },
  version: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
});
