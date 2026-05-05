import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRecipe, deleteRecipe } from '@/lib/recipes';
import { getSavedRecipeIds, saveRecipe, unsaveRecipe } from '@/lib/saved-recipes';
import { scaleIngredients, scaleCalories, caloriesPerServing, formatQuantity } from '@/lib/portion-scaling';
import RecipeImage from '@/components/RecipeImage';
import ServingStepper from '@/components/ServingStepper';
import type { Recipe } from '@/types/database';

type DetailTab = 'ingredients' | 'instructions';

/**
 * Parse raw instruction text into individual steps.
 * Handles multiple formats from TheMealDB and user input:
 *   - "STEP 1\nDo this.\nSTEP 2\nDo that."
 *   - "1. Do this.\n2. Do that."
 *   - "1) Do this.\n2) Do that."
 *   - Plain paragraphs separated by double newlines
 *   - Single string with \r\n line breaks
 */
function parseInstructionSteps(raw: string): string[] {
  if (!raw || !raw.trim()) return [];

  // Normalize line endings
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Try splitting by "STEP N" pattern (case insensitive)
  const stepPattern = /\bSTEP\s+\d+\b/gi;
  if (stepPattern.test(text)) {
    const parts = text
      .split(/\bSTEP\s+\d+\b/gi)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 1) return parts;
  }

  // Try splitting by numbered lines: "1. ", "2) ", "1- ", etc.
  const numberedPattern = /^\d+[\.\)\-]\s+/m;
  if (numberedPattern.test(text)) {
    const parts = text
      .split(/\n(?=\d+[\.\)\-]\s+)/)
      .map((s) => s.replace(/^\d+[\.\)\-]\s+/, '').trim())
      .filter(Boolean);
    if (parts.length > 1) return parts;
  }

  // Try splitting by double newlines (paragraphs)
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  // Fall back to single newlines
  const lines = text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  // Single block — return as-is
  return [text.trim()];
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { statusBarStyle, textHigh, textMedium, primary, secondary, error } = useThemeColors();
  const userId = session?.user?.id;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('ingredients');
  const [adjustedServings, setAdjustedServings] = useState<number>(0);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRecipe = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setLoadError(null);
      const [data, savedIds] = await Promise.all([
        getRecipe(id),
        userId ? getSavedRecipeIds(userId) : Promise.resolve(new Set<string>()),
      ]);
      setRecipe(data);
      setAdjustedServings(data.servings); // Initialize to recipe default
      setIsSaved(savedIds.has(id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recipe';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  // ── Scaled data (recomputed when servings change) ──
  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return scaleIngredients(recipe.ingredients, recipe.servings, adjustedServings);
  }, [recipe, adjustedServings]);

  const scaledCalories = useMemo(() => {
    if (!recipe) return null;
    return scaleCalories(recipe.calories, recipe.servings, adjustedServings);
  }, [recipe, adjustedServings]);

  const perServingCal = useMemo(() => {
    if (!recipe) return null;
    return caloriesPerServing(recipe.calories, recipe.servings);
  }, [recipe]);

  const isScaled = recipe ? adjustedServings !== recipe.servings : false;

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

  const handleResetServings = () => {
    if (recipe) setAdjustedServings(recipe.servings);
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
        <Text className="text-error mt-4">{loadError ? 'Failed to load recipe' : 'Recipe not found'}</Text>
        {loadError && (
          <Text className="text-text-disabled text-sm mt-1 text-center">{loadError}</Text>
        )}
        <View className="flex-row gap-3 mt-4">
          {loadError && (
            <Pressable
              onPress={loadRecipe}
              className="px-4 py-2 rounded-lg bg-primary"
            >
              <Text className="text-on-primary font-medium">Retry</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.back()}
            className="px-4 py-2 rounded-lg bg-surface-3"
          >
            <Text className="text-text-medium">Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isOwnRecipe = recipe.created_by === userId;

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

        <View className="flex-row gap-1.5">
          <Pressable
            onPress={handleToggleSave}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel={isSaved ? 'Unsave recipe' : 'Save recipe'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? primary : textHigh}
            />
          </Pressable>
          {isOwnRecipe && (
            <Pressable
              onPress={handleEdit}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
              accessibilityLabel="Edit recipe"
            >
              <Ionicons name="create-outline" size={22} color={primary} />
            </Pressable>
          )}
          {isOwnRecipe && (
            <Pressable
              onPress={handleDelete}
              disabled={isDeleting}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
              accessibilityLabel="Delete recipe"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={error} />
              ) : (
                <Ionicons name="trash-outline" size={22} color={error} />
              )}
            </Pressable>
          )}
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

        {/* Serving adjuster + nutrition info */}
        <View className="px-5 mb-5">
          <View className="flex-row items-center gap-3">
            {/* Serving stepper */}
            <ServingStepper
              value={adjustedServings}
              onChange={setAdjustedServings}
            />

            {/* Nutrition badges (scaled) */}
            <View className="flex-1 flex-row gap-2 flex-wrap">
              {scaledCalories != null && (
                <View className="flex-row items-center gap-1.5 bg-surface-2 px-3 py-2 rounded-full">
                  <Ionicons name="flame-outline" size={14} color={primary} />
                  <Text className="text-xs text-text-high font-medium">
                    {scaledCalories} kcal
                  </Text>
                </View>
              )}

              {perServingCal != null && (
                <View className="flex-row items-center gap-1.5 bg-surface-2 px-3 py-2 rounded-full">
                  <Ionicons name="person-outline" size={14} color={secondary} />
                  <Text className="text-xs text-text-high font-medium">
                    {perServingCal}/serving
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Scaled indicator */}
          {isScaled && (
            <Pressable
              onPress={handleResetServings}
              className="flex-row items-center gap-1.5 mt-2"
            >
              <Ionicons name="information-circle-outline" size={14} color={primary} />
              <Text className="text-xs text-primary">
                Scaled from {recipe.servings} servings
              </Text>
              <Text className="text-xs text-text-disabled ml-1">• Tap to reset</Text>
            </Pressable>
          )}
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
              {Array.isArray(scaledIngredients) && scaledIngredients.length > 0 ? (
                scaledIngredients.map((ing, idx) => (
                  <View
                    key={idx}
                    className={`flex-row items-center py-3 ${
                      idx < scaledIngredients.length - 1
                        ? 'border-b border-surface-3'
                        : ''
                    }`}
                  >
                    <View className="w-2 h-2 rounded-full bg-primary mr-3" />
                    <Text className="text-text-high flex-1">{ing.name}</Text>
                    {ing.quantity ? (
                      <Text className="text-text-medium text-sm">
                        {ing.quantity} {ing.unit}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text className="text-text-disabled py-4">No ingredients listed</Text>
              )}
            </View>
          ) : (
            <View className="card">
              {(() => {
                const steps = parseInstructionSteps(recipe.instructions);
                if (steps.length <= 1) {
                  return (
                    <Text className="text-text-high text-base leading-7">
                      {recipe.instructions}
                    </Text>
                  );
                }
                return steps.map((step, idx) => (
                  <View
                    key={idx}
                    className={`flex-row ${idx > 0 ? 'mt-5' : ''}`}
                  >
                    {/* Step number badge */}
                    <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-primary text-xs font-bold">
                        {idx + 1}
                      </Text>
                    </View>
                    {/* Step text */}
                    <Text className="text-text-high text-base leading-7 flex-1">
                      {step}
                    </Text>
                  </View>
                ));
              })()}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
