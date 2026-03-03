import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RecipeImage from '@/components/RecipeImage';
import type { Recipe, MealPlanWithRecipe } from '@/types/database';
import { MEAL_TYPE_LABELS } from '@/types/database';

type RecipeHeroCardProps = {
  recipe: Recipe | null;
  mealPlan?: MealPlanWithRecipe | null;
  onPressMealPlan: () => void;
  onPressAdd: () => void;
  onPressRecipe?: (id: string) => void;
};

export default function RecipeHeroCard({
  recipe,
  mealPlan,
  onPressMealPlan,
  onPressAdd,
  onPressRecipe,
}: RecipeHeroCardProps) {
  if (!recipe) {
    return (
      <View className="bg-surface-1 rounded-3xl p-6 items-center justify-center h-64">
        <Ionicons name="restaurant-outline" size={48} color="rgba(255,255,255,0.38)" />
        <Text className="text-text-medium mt-3 text-base">No recipes yet</Text>
        <Text className="text-text-disabled text-sm mt-1">
          Add your first recipe to get started
        </Text>
        <Pressable
          onPress={onPressAdd}
          className="mt-4 bg-primary px-5 py-2.5 rounded-full active:bg-primary-variant"
        >
          <Text className="text-on-primary font-semibold text-sm">+ Add Recipe</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="rounded-3xl overflow-hidden">
      {/* Hero image area — real image or emoji fallback */}
      <Link
        href={{ pathname: '/(app)/recipes/[id]', params: { id: recipe.id } }}
        asChild
      >
        <Pressable>
          <RecipeImage
            recipeId={recipe.id}
            imageUrl={recipe.image_url}
            size="hero"
          />
        </Pressable>
      </Link>

      {/* Recipe info */}
      <View className="bg-surface-1 px-4 pt-4 pb-3 -mt-4 rounded-b-3xl">
        <Text className="text-xl font-bold text-text-high mb-1.5">
          {recipe.title}
        </Text>

        {/* Meta row */}
        <View className="flex-row items-center gap-3 mb-3">
          {mealPlan && (
            <>
              <Text className="text-xs text-text-medium">
                {MEAL_TYPE_LABELS[mealPlan.meal_type]}
              </Text>
              <View className="w-1 h-1 rounded-full bg-text-disabled" />
            </>
          )}
          {recipe.calories != null && (
            <>
              <View className="flex-row items-center gap-1">
                <Ionicons name="flame-outline" size={12} color="#BB86FC" />
                <Text className="text-xs text-text-medium">
                  {recipe.calories} cal
                </Text>
              </View>
              <View className="w-1 h-1 rounded-full bg-text-disabled" />
            </>
          )}
          <View className="flex-row items-center gap-1">
            <Ionicons name="people-outline" size={12} color="#03DAC6" />
            <Text className="text-xs text-text-medium">
              {recipe.servings} servings
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={onPressMealPlan}
            className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border border-surface-4 active:bg-surface-3"
          >
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.87)" />
            <Text className="text-sm text-text-high">Meal plan</Text>
          </Pressable>
          <Pressable
            onPress={onPressAdd}
            className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary active:bg-primary-variant"
          >
            <Ionicons name="add" size={16} color="#000000" />
            <Text className="text-sm font-semibold text-on-primary">Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
