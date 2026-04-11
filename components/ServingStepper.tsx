import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

type ServingStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Compact mode for inline usage (AddMealModal rows) */
  compact?: boolean;
  /** Label override (default: "servings") */
  label?: string;
};

export default function ServingStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  compact = false,
  label = 'servings',
}: ServingStepperProps) {
  const { primary, textHigh, textDisabled, onPrimary } = useThemeColors();

  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (canIncrement) onChange(value + 1);
  };

  if (compact) {
    return (
      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={handleDecrement}
          disabled={!canDecrement}
          className={`w-7 h-7 rounded-full items-center justify-center ${
            canDecrement ? 'bg-surface-3 active:bg-surface-5' : 'bg-surface-2'
          }`}
          accessibilityLabel="Decrease servings"
        >
          <Ionicons
            name="remove"
            size={14}
            color={canDecrement ? textHigh : textDisabled}
          />
        </Pressable>

        <Text className="text-text-high text-sm font-bold w-6 text-center">
          {value}
        </Text>

        <Pressable
          onPress={handleIncrement}
          disabled={!canIncrement}
          className={`w-7 h-7 rounded-full items-center justify-center ${
            canIncrement ? 'bg-primary active:bg-primary-variant' : 'bg-surface-2'
          }`}
          accessibilityLabel="Increase servings"
        >
          <Ionicons
            name="add"
            size={14}
            color={canIncrement ? onPrimary : textDisabled}
          />
        </Pressable>
      </View>
    );
  }

  // Full-size variant (recipe detail page)
  return (
    <View className="flex-row items-center bg-surface-2 rounded-2xl px-3 py-2">
      <Pressable
        onPress={handleDecrement}
        disabled={!canDecrement}
        className={`w-8 h-8 rounded-full items-center justify-center ${
          canDecrement ? 'bg-surface-4 active:bg-surface-5' : 'bg-surface-3'
        }`}
        accessibilityLabel="Decrease servings"
      >
        <Ionicons
          name="remove"
          size={16}
          color={canDecrement ? textHigh : textDisabled}
        />
      </Pressable>

      <View className="items-center mx-3">
        <Text className="text-text-high text-lg font-bold">{value}</Text>
        <Text className="text-text-medium text-[10px] -mt-0.5">{label}</Text>
      </View>

      <Pressable
        onPress={handleIncrement}
        disabled={!canIncrement}
        className={`w-8 h-8 rounded-full items-center justify-center ${
          canIncrement ? 'bg-primary active:bg-primary-variant' : 'bg-surface-3'
        }`}
        accessibilityLabel="Increase servings"
      >
        <Ionicons
          name="add"
          size={16}
          color={canIncrement ? onPrimary : textDisabled}
        />
      </Pressable>
    </View>
  );
}
