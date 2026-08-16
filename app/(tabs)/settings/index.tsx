import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, IconPicker, ListItem, Screen, TextField, Toggle } from '@/components/ui';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function SettingsScreen() {
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const styles = createStyles(colors);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    setSubmitting(true);
    try {
      await addCategory({ name: newCategory.trim(), icon: newCategoryIcon });
      setNewCategory('');
      setNewCategoryIcon(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Profil</Text>

      <Card style={styles.card}>
        <ListItem title="Comptes" subtitle="Voir et gérer tes comptes" onPress={() => router.push('/accounts')} />
        <ListItem title="Budgets" subtitle="Limites par catégorie" onPress={() => router.push('/budgets')} />
        <ListItem title="Épargne" subtitle="Poches d'épargne" onPress={() => router.push('/savings')} />
      </Card>

      <Card style={styles.card}>
        <ListItem
          title="Thème sombre"
          subtitle={mode === 'dark' ? 'Activé' : 'Désactivé — thème clair actif'}
          right={<Toggle value={mode === 'dark'} onValueChange={() => void toggleTheme()} />}
        />
      </Card>

      <Card style={styles.card}>
        <ListItem title="Sécurité" subtitle="Nom d'utilisateur, code PIN, biométrie" onPress={() => router.push('/settings/security')} />
        <ListItem title="Alertes" subtitle="Budgets, solde faible, objectifs, rappels" onPress={() => router.push('/settings/alerts')} />
        <ListItem
          title="Sources SMS"
          subtitle="Détection des transactions financières"
          onPress={() => router.push('/settings/sms-sources')}
        />
        <ListItem title="Sauvegarde" subtitle="Exporter / importer vos données" onPress={() => router.push('/settings/backup')} />
        <ListItem title="Export Excel" subtitle="Exporter vos données au format .xlsx" onPress={() => router.push('/settings/export')} />
      </Card>

      <Text style={styles.sectionTitle}>Catégories</Text>
      <Card style={styles.card}>
        {categories.length === 0 ? (
          <Text style={styles.hint}>Aucune catégorie pour le moment.</Text>
        ) : (
          categories.map((category) => (
            <ListItem
              key={category.id}
              title={category.name}
              left={
                <Ionicons
                  name={(category.icon as keyof typeof Ionicons.glyphMap) ?? 'pricetag-outline'}
                  size={20}
                  color={colors.text.secondary}
                />
              }
              onPress={() => router.push(`/settings/categories/${category.id}`)}
            />
          ))
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
      <IconPicker value={newCategoryIcon} onChange={setNewCategoryIcon} />

      <Text style={styles.version}>MManagment v1.0.0</Text>
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
}
