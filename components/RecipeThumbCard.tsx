import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RecipeImage from '@/components/RecipeImage';
import type { Recipe } from '@/types/database';

type RecipeThumbCardProps = {
  recipe: Recipe;
  onPress: (id: string) => void;
};

export default function RecipeThumbCard({ recipe, onPress }: RecipeThumbCardProps) {
  return (
    <Link
      href={{ pathname: '/(app)/recipes/[id]', params: { id: recipe.id } }}
      asChild
    >
      <Pressable className="w-40 mr-3 active:opacity-80">
        {/* Recipe thumbnail — real image or emoji fallback */}
        <View className="mb-2">
          <RecipeImage
            recipeId={recipe.id}
            imageUrl={recipe.image_url}
            size="thumb"
          />
        </View>

        {/* Title */}
        <Text className="text-sm font-semibold text-text-high mb-0.5" numberOfLines={1}>
          {recipe.title}
        </Text>

        {/* Meta */}
        <View className="flex-row items-center gap-2">
          {recipe.calories != null && (
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="flame-outline" size={11} color="#BB86FC" />
              <Text className="text-xs text-text-disabled">{recipe.calories} cal</Text>
            </View>
          )}
          <View className="flex-row items-center gap-0.5">
            <Ionicons name="people-outline" size={11} color="#03DAC6" />
            <Text className="text-xs text-text-disabled">{recipe.servings} srv</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
