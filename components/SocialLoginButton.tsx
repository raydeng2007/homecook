import { Pressable, Text, View } from 'react-native';

type SocialProvider = 'google' | 'facebook' | 'email';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onPress: () => void;
}

const providerConfig: Record<SocialProvider, { label: string; icon: string }> = {
  google: { label: 'Continue with Google', icon: 'G' },
  facebook: { label: 'Continue with Facebook', icon: 'f' },
  email: { label: 'Continue with Email', icon: '@' },
};

export function SocialLoginButton({ provider, onPress }: SocialLoginButtonProps) {
  const { label, icon } = providerConfig[provider];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-surface-1 active:bg-surface-3 py-4 px-6 rounded-xl"
    >
      <View className="w-8 h-8 items-center justify-center mr-4">
        <Text className="text-xl font-bold text-primary">{icon}</Text>
      </View>
      <Text className="text-base font-medium text-text-high">{label}</Text>
    </Pressable>
  );
}
