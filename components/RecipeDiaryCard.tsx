import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWarmColor } from '@/lib/recipe-visuals';
import RecipeImage from '@/components/RecipeImage';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Recipe } from '@/types/database';

type RecipeDiaryCardProps = {
  recipe: Recipe;
  index: number;
  onPress: (id: string) => void;
};

export default function RecipeDiaryCard({
  recipe,
  index,
  onPress,
}: RecipeDiaryCardProps) {
  const { textDisabled } = useThemeColors();
  const cardBg = getWarmColor(index);

  return (
    <Link
      href={{ pathname: '/(app)/recipes/[id]', params: { id: recipe.id } }}
      asChild
    >
      <Pressable
        className="rounded-2xl p-4 flex-row items-center mb-3 active:opacity-90"
        style={{ backgroundColor: cardBg + '20' }} // 12% opacity warm background
      >
        {/* Circular image thumbnail */}
        <View className="mr-4">
          <RecipeImage
            recipeId={recipe.id}
            imageUrl={recipe.image_url}
            size="circle"
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-base font-bold text-text-high mb-1" numberOfLines={1}>
            {recipe.title}
          </Text>
          <View className="flex-row items-center gap-3">
            {recipe.calories != null && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="flame-outline" size={12} color={cardBg} />
                <Text className="text-xs" style={{ color: cardBg }}>
                  {recipe.calories} cal
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <Ionicons name="people-outline" size={12} color={cardBg} />
              <Text className="text-xs" style={{ color: cardBg }}>
                {recipe.servings} servings
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={18} color={textDisabled} />
      </Pressable>
    </Link>
  );
}
