import { View, Text, Alert, Image, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SocialLoginButton } from '@/components/SocialLoginButton';
import { signInWithGoogle, signInWithFacebook } from '@/lib/auth';

const logoImage = require('@/assets/icon.png');

export default function LoginScreen() {
  const router = useRouter();
  const { statusBarStyle } = useThemeColors();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Gentle wobble: a slow, organic rotation back and forth
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Small pause before starting so it feels natural
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(wobble, {
            toValue: -1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(wobble, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          // Tiny rest between cycles
          Animated.delay(800),
        ])
      ).start();
    }, 600);

    return () => clearTimeout(timeout);
  }, [wobble]);

  const rotate = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-4deg', '0deg', '4deg'],
  });

  const scale = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.97, 1, 0.97],
  });

  const handleGoogleLogin = async () => {
    if (isOAuthLoading) return;
    try {
      setIsOAuthLoading(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Login Error', String(error));
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (isOAuthLoading) return;
    try {
      setIsOAuthLoading(true);
      await signInWithFacebook();
    } catch (error) {
      Alert.alert('Login Error', String(error));
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleEmailLogin = () => {
    router.push('/(auth)/email-sign-in');
  };

  return (
    <View className="screen items-center justify-center px-6">
      <StatusBar style={statusBarStyle} />

      {/* Title */}
      <View className="items-center mb-6">
        <Text className="text-lg text-text-medium">the</Text>
        <Text className="text-4xl font-bold text-text-high">Homecook</Text>
      </View>

      {/* Logo with gentle wobble */}
      <Animated.View
        style={{
          transform: [{ rotate }, { scale }],
        }}
        className="mb-12"
      >
        <Image
          source={logoImage}
          style={{ width: 144, height: 144 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Social Login Buttons */}
      <View className="w-full gap-4">
        <SocialLoginButton provider="google" onPress={handleGoogleLogin} disabled={isOAuthLoading} testID="login-google-btn" />
        <SocialLoginButton provider="facebook" onPress={handleFacebookLogin} disabled={isOAuthLoading} testID="login-facebook-btn" />
        <SocialLoginButton provider="email" onPress={handleEmailLogin} disabled={isOAuthLoading} testID="login-email-btn" />
      </View>
    </View>
  );
}
