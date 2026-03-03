import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useHome } from '@/contexts/HomeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRecipes } from '@/lib/recipes';
import { addMealPlan } from '@/lib/meal-plans';
import RecipeImage from '@/components/RecipeImage';
import MealTypeTabBar from '@/components/MealTypeTabBar';
import type { Recipe, MealType } from '@/types/database';

type AddMealModalProps = {
  visible: boolean;
  date: string; // YYYY-MM-DD
  dateLabel: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddMealModal({
  visible,
  date,
  dateLabel,
  onClose,
  onAdded,
}: AddMealModalProps) {
  const { session } = useAuth();
  const { home } = useHome();
  const { textHigh, textDisabled, primary } = useThemeColors();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [isSaving, setIsSaving] = useState(false);

  const loadRecipes = useCallback(async () => {
    if (!home?.id) return;
    try {
      setIsLoadingRecipes(true);
      const data = await getRecipes(home.id);
      setRecipes(data);
    } catch (err) {
      console.error('[AddMeal] Failed to load recipes:', err);
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [home?.id]);

  useEffect(() => {
    if (visible) {
      loadRecipes();
    }
  }, [visible, loadRecipes]);

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!home?.id || !session?.user?.id) return;

    try {
      setIsSaving(true);
      await addMealPlan({
        home_id: home.id,
        recipe_id: recipe.id,
        date,
        meal_type: selectedMealType,
        servings: recipe.servings,
        created_by: session.user.id,
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error('[AddMeal] Failed to add meal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-5 pt-6 pb-4 bg-surface-1 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-text-high">Add Meal</Text>
            <Text className="text-sm text-text-medium mt-0.5">{dateLabel}</Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
          >
            <Ionicons name="close" size={24} color={textHigh} />
          </Pressable>
        </View>

        {/* Meal type tab bar */}
        <View className="px-5 pt-3 pb-1">
          <MealTypeTabBar
            selected={selectedMealType}
            onSelect={setSelectedMealType}
          />
        </View>

        {/* Recipe list */}
        <View className="flex-1 px-5 pt-3">
          <Text className="section-heading mb-3">Choose a recipe</Text>

          {isLoadingRecipes ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={primary} />
            </View>
          ) : recipes.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons
                name="book-outline"
                size={48}
                color={textDisabled}
              />
              <Text className="text-text-medium mt-4">No recipes yet</Text>
              <Text className="text-xs text-text-disabled mt-1">
                Create a recipe first, then plan meals
              </Text>
            </View>
          ) : (
            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                return (
                  <Pressable
                    onPress={() => handleSelectRecipe(item)}
                    disabled={isSaving}
                    className="card mb-2 flex-row items-center active:bg-surface-3"
                  >
                    {/* Recipe image thumbnail */}
                    <View className="mr-3">
                      <RecipeImage
                        recipeId={item.id}
                        imageUrl={item.image_url}
                        size="circle"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-text-high font-semibold" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-text-medium text-xs mt-0.5" numberOfLines={1}>
                        {item.calories ? `${item.calories} cal` : ''}{item.calories && item.servings ? ' · ' : ''}{item.servings} servings
                      </Text>
                    </View>
                    {isSaving ? (
                      <ActivityIndicator size="small" color={primary} />
                    ) : (
                      <Ionicons
                        name="add-circle"
                        size={24}
                        color={primary}
                      />
                    )}
                  </Pressable>
                );
              }}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
