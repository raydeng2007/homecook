import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getRecipe, updateRecipe } from '@/lib/recipes';
import RecipeForm from '@/components/RecipeForm';
import type { RecipeFormData } from '@/components/RecipeForm';
import type { Recipe } from '@/types/database';

export default function EditRecipeScreen() {
  const router = useRouter();
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
      console.error('[EditRecipe] Failed to load:', err);
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
      console.error('[EditRecipe] Error:', err);
      Alert.alert('Error', 'Failed to update recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator size="large" color="#BB86FC" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="screen items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#CF6679" />
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
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-surface-1 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.87)" />
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
