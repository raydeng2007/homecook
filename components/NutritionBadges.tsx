import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

type NutritionBadgesProps = {
  calories: number | null;
  servings: number;
};

export default function NutritionBadges({ calories, servings }: NutritionBadgesProps) {
  const { primary, secondary } = useThemeColors();
  return (
    <View className="flex-row gap-2">
      {calories != null && (
        <View className="flex-row items-center gap-1.5 bg-surface-2 px-3 py-2 rounded-full">
          <Ionicons name="flame-outline" size={14} color={primary} />
          <Text className="text-xs text-text-high font-medium">
            {calories} kcal
          </Text>
        </View>
      )}

      <View className="flex-row items-center gap-1.5 bg-surface-2 px-3 py-2 rounded-full">
        <Ionicons name="people-outline" size={14} color={secondary} />
        <Text className="text-xs text-text-high font-medium">
          {servings} servings
        </Text>
      </View>

      {/* Placeholder badges for future fields */}
      <View className="flex-row items-center gap-1.5 bg-surface-2 px-3 py-2 rounded-full">
        <Ionicons name="nutrition-outline" size={14} color="#8FB88E" />
        <Text className="text-xs text-text-disabled font-medium">
          --
        </Text>
      </View>
    </View>
  );
}
