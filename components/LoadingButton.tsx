import { Pressable, Text, ActivityIndicator } from 'react-native';

interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function LoadingButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
}: LoadingButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`bg-primary px-4 py-4 rounded-xl flex-row items-center justify-center ${
        isDisabled ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {isLoading ? (
        <ActivityIndicator color="#000000" size="small" />
      ) : (
        <Text className="text-on-primary font-semibold text-base">{title}</Text>
      )}
    </Pressable>
  );
}
