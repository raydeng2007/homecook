import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/Icon';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRecipe, updateRecipe } from '@/lib/recipes';
import RecipeForm from '@/components/RecipeForm';
import type { RecipeFormData } from '@/components/RecipeForm';
import type { Recipe } from '@/types/database';

export default function EditRecipeScreen() {
  const router = useRouter();
  const { statusBarStyle, primary, error: errorColor, textHigh } = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadRecipe = useCallback(async () => {
    if (!id) return;
    try {
      setIsPageLoading(true);
      const data = await getRecipe(id);
      setRecipe(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load recipe. Please go back and try again.');
    } finally {
      setIsPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleSubmit = async (data: RecipeFormData) => {
    if (!id) return;

    try {
      setIsSaving(true);
      await updateRecipe(id, data);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to update recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="screen items-center justify-center px-6">
        <Icon name="alert-circle-outline" size={48} color={errorColor} />
        <Text className="text-error mt-4">Recipe not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg bg-surface-3"
        >
          <Text className="text-text-medium">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="screen">
      <StatusBar style={statusBarStyle} />

      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-surface-1 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color={textHigh} />
        </Pressable>
        <Text className="heading-2">Edit Recipe</Text>
      </View>

      <RecipeForm
        initialData={recipe}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        submitLabel="Save Changes"
      />
    </View>
  );
}
