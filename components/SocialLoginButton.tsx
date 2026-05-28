import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Icon } from '@/components/Icon';
import { useThemeColors } from '@/hooks/useThemeColors';

type SocialProvider = 'google' | 'facebook' | 'email' | 'apple';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

const providerConfig: Record<SocialProvider, { label: string; icon: string; ionicon?: string }> = {
  apple: { label: 'Continue with Apple', icon: '', ionicon: 'logo-apple' },
  google: { label: 'Continue with Google', icon: 'G' },
  facebook: { label: 'Continue with Facebook', icon: 'f' },
  email: { label: 'Continue with Email', icon: '@' },
};

export function SocialLoginButton({ provider, onPress, disabled, testID }: SocialLoginButtonProps) {
  const { label, icon, ionicon } = providerConfig[provider];
  const { textHigh } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      className={`flex-row items-center bg-surface-1 active:bg-surface-3 py-4 px-6 rounded-xl ${disabled ? 'opacity-50' : ''}`}
    >
      <View className="w-8 h-8 items-center justify-center mr-4">
        {ionicon ? (
          <Icon name={ionicon as string} size={24} color={textHigh} />
        ) : (
          <Text className="text-xl font-bold text-primary">{icon}</Text>
        )}
      </View>
      <Text className="text-base font-medium text-text-high">{label}</Text>
    </Pressable>
  );
}
