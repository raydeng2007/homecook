import { View, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SocialLoginButton } from '@/components/SocialLoginButton';
import { signInWithGoogle, signInWithFacebook } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
      Alert.alert('Login Error', String(error));
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithFacebook();
    } catch (error) {
      console.error('Facebook login failed:', error);
      Alert.alert('Login Error', String(error));
    }
  };

  const handleEmailLogin = () => {
    router.push('/(auth)/email-sign-in');
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
