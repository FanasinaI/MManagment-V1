import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, IconPicker, Screen, TextField } from '@/components/ui';
import { useCategoriesStore } from '@/state/categoriesStore';
import { useThemeStore } from '@/state/themeStore';
import { spacing, type ThemeColors, typography } from '@/theme';

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = useCategoriesStore((s) => s.categories.find((c) => c.id === id));
  const updateCategory = useCategoriesStore((s) => s.updateCategory);
  const removeCategory = useCategoriesStore((s) => s.removeCategory);
  const colors = useThemeStore((s) => s.colors);
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
    }
  }, [category]);

  if (!category) {
    return (
      <Screen>
        <Text style={styles.notFound}>Catégorie introuvable.</Text>
      </Screen>
    );
  }

  const canSubmit = name.trim().length > 0 && !submitting;

  async function handleSave() {
    setSubmitting(true);
    try {
      await updateCategory(category!.id, { name: name.trim(), icon });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await removeCategory(category!.id);
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.heading}>Modifier la catégorie</Text>

      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex : Alimentation" />

      <Text style={styles.label}>Icône</Text>
      <IconPicker value={icon} onChange={setIcon} />

      <Button label="Enregistrer" onPress={() => void handleSave()} disabled={!canSubmit} loading={submitting} />

      {confirmingDelete ? (
        <>
          <Text style={styles.warning}>
            Supprimer cette catégorie retirera son association avec les transactions et budgets existants.
          </Text>
          <Button label="Confirmer la suppression" variant="danger" onPress={() => void handleDelete()} loading={submitting} style={styles.deleteButton} />
          <Button label="Annuler" variant="ghost" onPress={() => setConfirmingDelete(false)} disabled={submitting} />
        </>
      ) : (
        <Button label="Supprimer cette catégorie" variant="danger" onPress={() => setConfirmingDelete(true)} style={styles.deleteButton} />
      )}
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
    label: {
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.sm,
    },
    deleteButton: {
      marginTop: spacing.xl,
    },
    warning: {
      color: colors.semantic.warning,
      fontSize: typography.size.xs,
      marginTop: spacing.lg,
    },
    notFound: {
      color: colors.text.muted,
      marginTop: spacing.xl,
      textAlign: 'center',
    },
  });
}
