import { Pressable, Text, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  testID?: string;
}

export function LoadingButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  testID,
}: LoadingButtonProps) {
  const { onPrimary } = useThemeColors();
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      className={`bg-primary px-4 py-4 rounded-xl flex-row items-center justify-center ${
        isDisabled ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {isLoading ? (
        <ActivityIndicator color={onPrimary} size="small" />
      ) : (
        <Text className="text-on-primary font-semibold text-base">{title}</Text>
      )}
    </Pressable>
  );
}
