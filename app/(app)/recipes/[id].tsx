import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRecipe, deleteRecipe } from '@/lib/recipes';
import { getSavedRecipeIds, saveRecipe, unsaveRecipe } from '@/lib/saved-recipes';
import RecipeImage from '@/components/RecipeImage';
import NutritionBadges from '@/components/NutritionBadges';
import type { Recipe } from '@/types/database';

type DetailTab = 'ingredients' | 'instructions';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { statusBarStyle, textHigh, primary, error } = useThemeColors();
  const userId = session?.user?.id;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('ingredients');

  const loadRecipe = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [data, savedIds] = await Promise.all([
        getRecipe(id),
        userId ? getSavedRecipeIds(userId) : Promise.resolve(new Set<string>()),
      ]);
      setRecipe(data);
      setIsSaved(savedIds.has(id));
    } catch (err) {
      console.error('[RecipeDetail] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleToggleSave = async () => {
    if (!id || !userId) return;
    setIsSaved((prev) => !prev);
    try {
      if (isSaved) {
        await unsaveRecipe(userId, id);
      } else {
        await saveRecipe(userId, id);
      }
    } catch (err) {
      setIsSaved((prev) => !prev); // revert
      console.error('[RecipeDetail] Save toggle failed:', err);
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteRecipe(id);
              router.back();
            } catch (err) {
              console.error('[RecipeDetail] Delete failed:', err);
              Alert.alert('Error', 'Failed to delete recipe');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!id) return;
    router.push({ pathname: '/(app)/recipes/edit', params: { id } });
  };

  if (isLoading) {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="screen items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color={error} />
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
      <View className="px-5 pt-14 pb-3 bg-surface-1 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={textHigh} />
          </Pressable>
          <Text className="text-lg font-bold text-text-high flex-1" numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={handleToggleSave}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface-3 active:bg-surface-5"
            accessibilityLabel={isSaved ? 'Unsave recipe' : 'Save recipe'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isSaved ? primary : textHigh}
            />
          </Pressable>
          <Pressable
            onPress={handleEdit}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface-3 active:bg-surface-5"
            accessibilityLabel="Edit recipe"
          >
            <Ionicons name="pencil" size={16} color={primary} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface-3 active:bg-surface-5"
            accessibilityLabel="Delete recipe"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={error} />
            ) : (
              <Ionicons name="trash" size={16} color={error} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View className="mx-5 mt-4">
          <RecipeImage
            recipeId={recipe.id}
            imageUrl={recipe.image_url}
            size="hero"
          />
        </View>

        {/* Title + description */}
        <View className="px-5 mt-4">
          <Text className="text-2xl font-bold text-text-high mb-1">
            {recipe.title}
          </Text>
          <Text className="text-sm text-text-medium mb-4">
            {recipe.description}
          </Text>
        </View>

        {/* Nutrition badges */}
        <View className="px-5 mb-5">
          <NutritionBadges
            calories={recipe.calories}
            servings={recipe.servings}
          />
        </View>

        {/* Tab bar: Ingredients / Instructions */}
        <View className="flex-row mx-5 border-b border-surface-3 mb-4">
          <Pressable
            onPress={() => setActiveTab('ingredients')}
            className="flex-1 items-center py-3"
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === 'ingredients' ? 'text-primary' : 'text-text-medium'
              }`}
            >
              Ingredients
            </Text>
            {activeTab === 'ingredients' && (
              <View className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary" />
            )}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('instructions')}
            className="flex-1 items-center py-3"
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === 'instructions' ? 'text-primary' : 'text-text-medium'
              }`}
            >
              Preparation
            </Text>
            {activeTab === 'instructions' && (
              <View className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary" />
            )}
          </Pressable>
        </View>

        {/* Tab content */}
        <View className="px-5">
          {activeTab === 'ingredients' ? (
            <View className="card">
              {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ing, idx) => (
                  <View
                    key={idx}
                    className={`flex-row items-center py-3 ${
                      idx < recipe.ingredients.length - 1
                        ? 'border-b border-surface-3'
                        : ''
                    }`}
                  >
                    <View className="w-2 h-2 rounded-full bg-primary mr-3" />
                    <Text className="text-text-high flex-1">{ing.name}</Text>
                    {ing.quantity && (
                      <Text className="text-text-medium text-sm">
                        {ing.quantity} {ing.unit}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text className="text-text-disabled py-4">No ingredients listed</Text>
              )}
            </View>
          ) : (
            <View className="card">
              <Text className="text-text-high text-base leading-6">
                {recipe.instructions}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
