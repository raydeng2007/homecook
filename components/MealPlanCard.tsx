import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecipeImage from '@/components/RecipeImage';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { MealPlanWithRecipe } from '@/types/database';
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS } from '@/types/database';

type MealPlanCardProps = {
  mealPlan: MealPlanWithRecipe;
  onDelete: (id: string) => void;
};

export default function MealPlanCard({ mealPlan, onDelete }: MealPlanCardProps) {
  const { textDisabled } = useThemeColors();
  const mealColor = MEAL_TYPE_COLORS[mealPlan.meal_type] ?? '#BB86FC';
  const mealLabel = MEAL_TYPE_LABELS[mealPlan.meal_type] ?? mealPlan.meal_type;

  return (
    <View className="card mb-3 flex-row items-center">
      {/* Circular image thumbnail */}
      <View className="mr-3">
        <RecipeImage
          recipeId={mealPlan.recipe_id}
          imageUrl={mealPlan.recipe?.image_url}
          size="circle"
        />
      </View>

      <View className="flex-1">
        {/* Meal type badge */}
        <Text className="text-xs font-medium mb-0.5" style={{ color: mealColor }}>
          {mealLabel}
        </Text>

        {/* Recipe title */}
        <Text className="text-text-high font-semibold text-base" numberOfLines={1}>
          {mealPlan.recipe?.title ?? 'Unknown recipe'}
        </Text>

        {/* Servings + calories */}
        <Text className="text-text-disabled text-xs mt-0.5">
          {mealPlan.servings} servings
          {mealPlan.recipe?.calories != null &&
            ` · ${mealPlan.recipe.calories} cal`}
        </Text>
      </View>

      {/* Delete button */}
      <Pressable
        onPress={() => onDelete(mealPlan.id)}
        className="w-9 h-9 items-center justify-center rounded-full active:bg-surface-3"
        accessibilityLabel="Remove meal"
      >
        <Ionicons name="close" size={18} color={textDisabled} />
      </Pressable>
    </View>
  );
}
