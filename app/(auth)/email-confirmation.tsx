import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LoadingButton } from '@/components/LoadingButton';
import { resendConfirmationEmail } from '@/lib/auth';

export default function EmailConfirmationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      const result = await resendConfirmationEmail(email);

      if (result.success) {
        setResendSuccess(true);
        setCooldown(60); // 60 second cooldown between resends
      } else if (result.error) {
        setResendError(result.error);
      }
    } catch (err) {
      setResendError('Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View className="screen px-6">
      <StatusBar style="light" />

      <View className="flex-1 justify-center items-center">
        {/* Email Icon Placeholder */}
        <View className="w-20 h-20 bg-surface-2 rounded-full items-center justify-center mb-6">
          <Text className="text-4xl">✉️</Text>
        </View>

        {/* Header */}
        <Text className="text-3xl font-bold text-text-high mb-2 text-center">
          Check Your Inbox
        </Text>

        <Text className="text-text-medium text-center mb-2">
          We've sent a confirmation link to:
        </Text>

        <Text className="text-primary font-semibold text-center mb-8">
          {email}
        </Text>

        <Text className="text-text-medium text-center mb-8 px-4">
          Click the link in the email to confirm your account, then come back here to sign in.
        </Text>

        {/* Success Message */}
        {resendSuccess && (
          <View className="bg-secondary/10 border border-secondary rounded-xl p-3 mb-4 w-full">
            <Text className="text-secondary text-sm text-center">
              Confirmation email sent!
            </Text>
          </View>
        )}

        {/* Error Message */}
        {resendError && (
          <View className="bg-error/10 border border-error rounded-xl p-3 mb-4 w-full">
            <Text className="text-error text-sm text-center">{resendError}</Text>
          </View>
        )}

        {/* Resend Button */}
        <View className="w-full mb-4">
          <LoadingButton
            title={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Confirmation Email'}
            onPress={handleResend}
            isLoading={isResending}
            disabled={cooldown > 0}
          />
        </View>

        {/* Back to Login */}
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          className="py-3"
        >
          <Text className="text-text-medium">
            Back to{' '}
            <Text className="text-primary font-semibold">Login</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
