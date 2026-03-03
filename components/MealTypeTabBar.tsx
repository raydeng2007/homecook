import { View, Text, Pressable } from 'react-native';
import type { MealType } from '@/types/database';
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS } from '@/types/database';

type MealTypeTabBarProps = {
  selected: MealType;
  onSelect: (type: MealType) => void;
  types?: MealType[];
};

const DEFAULT_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealTypeTabBar({
  selected,
  onSelect,
  types = DEFAULT_TYPES,
}: MealTypeTabBarProps) {
  return (
    <View className="flex-row border-b border-surface-3">
      {types.map((type) => {
        const isActive = selected === type;
        const color = MEAL_TYPE_COLORS[type];

        return (
          <Pressable
            key={type}
            onPress={() => onSelect(type)}
            className="flex-1 items-center py-3"
          >
            <Text
              className={`text-sm font-medium ${
                isActive ? '' : 'text-text-medium'
              }`}
              style={isActive ? { color } : undefined}
            >
              {MEAL_TYPE_LABELS[type]}
            </Text>

            {/* Underline indicator */}
            {isActive && (
              <View
                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
