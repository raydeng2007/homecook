import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Ingredient } from '@/types/database';

type IngredientRowProps = {
  ingredient: Ingredient;
  onChange: (updated: Ingredient) => void;
  onRemove: () => void;
};

export default function IngredientRow({
  ingredient,
  onChange,
  onRemove,
}: IngredientRowProps) {
  const { textDisabled, error } = useThemeColors();
  return (
    <View className="flex-row items-center gap-2 mb-2">
      {/* Name — takes most space */}
      <TextInput
        className="flex-[3] bg-surface-2 border border-surface-4 px-3 py-2.5 rounded-xl text-sm text-text-high"
        placeholder="Ingredient"
        placeholderTextColor={textDisabled}
        value={ingredient.name}
        onChangeText={(text) => onChange({ ...ingredient, name: text })}
      />

      {/* Quantity */}
      <TextInput
        className="flex-1 bg-surface-2 border border-surface-4 px-3 py-2.5 rounded-xl text-sm text-text-high text-center"
        placeholder="Qty"
        placeholderTextColor={textDisabled}
        value={ingredient.quantity}
        onChangeText={(text) => onChange({ ...ingredient, quantity: text })}
        keyboardType="numeric"
      />

      {/* Unit */}
      <TextInput
        className="flex-1 bg-surface-2 border border-surface-4 px-3 py-2.5 rounded-xl text-sm text-text-high text-center"
        placeholder="Unit"
        placeholderTextColor={textDisabled}
        value={ingredient.unit}
        onChangeText={(text) => onChange({ ...ingredient, unit: text })}
      />

      {/* Remove button */}
      <Pressable
        onPress={onRemove}
        className="w-9 h-9 items-center justify-center rounded-full active:bg-surface-3"
        accessibilityLabel="Remove ingredient"
      >
        <Ionicons name="close-circle" size={22} color={error} />
      </Pressable>
    </View>
  );
}
