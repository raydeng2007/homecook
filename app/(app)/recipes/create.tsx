import { View, Text, Pressable, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useHome } from '@/contexts/HomeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createRecipe } from '@/lib/recipes';
import RecipeForm from '@/components/RecipeForm';
import type { RecipeFormData } from '@/components/RecipeForm';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { home } = useHome();
  const { statusBarStyle, textHigh } = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: RecipeFormData) => {
    if (!home?.id || !session?.user?.id) return;

    try {
      setIsLoading(true);
      await createRecipe({
        ...data,
        home_id: home.id,
        created_by: session.user.id,
      });
      router.back();
    } catch (err) {
      console.error('[CreateRecipe] Error:', err);
      Alert.alert('Error', 'Failed to create recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Ionicons name="arrow-back" size={24} color={textHigh} />
        </Pressable>
        <Text className="heading-2">New Recipe</Text>
      </View>

      <RecipeForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Create Recipe"
      />
    </View>
  );
}
