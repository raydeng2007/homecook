import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SocialLoginButton } from '@/components/SocialLoginButton';

export default function LandingPage() {
  const handleGoogleLogin = () => {
    console.log('Google login');
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login');
  };

  const handleEmailLogin = () => {
    console.log('Email login');
  };

  return (
    <View className="screen items-center justify-center px-6">
      <StatusBar style="light" />

      {/* Title */}
      <View className="items-center mb-8">
        <Text className="text-lg text-text-medium">the</Text>
        <Text className="text-4xl font-bold text-text-high">Homecook</Text>
      </View>

      {/* Logo Placeholder */}
      <View className="w-32 h-32 bg-surface-1 rounded-2xl items-center justify-center mb-12">
        <Text className="text-text-medium text-sm">Logo</Text>
        <Text className="text-text-medium text-sm">Placeholder</Text>
      </View>

      {/* Social Login Buttons */}
      <View className="w-full gap-4">
        <SocialLoginButton provider="google" onPress={handleGoogleLogin} />
        <SocialLoginButton provider="facebook" onPress={handleFacebookLogin} />
        <SocialLoginButton provider="email" onPress={handleEmailLogin} />
      </View>
    </View>
  );
}
