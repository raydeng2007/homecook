import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { FormInput } from '@/components/FormInput';
import { LoadingButton } from '@/components/LoadingButton';
import { signInWithEmail } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function EmailSignInScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field-level errors (shown on blur)
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    return !emailErr && !passwordErr;
  };

  const handleSignIn = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithEmail(email, password);

      if (!result.success && result.error) {
        setError(result.error);
        // Clear password on error for security
        setPassword('');
      }
      // On success, AuthContext will detect the session and redirect automatically
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() && password;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="screen"
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6">
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="mt-14 mb-6 flex-row items-center"
          >
            <Text className="text-primary text-lg leading-none mr-1">‹</Text>
            <Text className="text-primary text-base">Back</Text>
          </Pressable>

          {/* Header */}
          <Text className="text-3xl font-bold text-text-high mb-2">
            Sign In
          </Text>
          <Text className="text-text-medium mb-8">
            Welcome back! Sign in to your account.
          </Text>

          {/* Form */}
          <View>
            <FormInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(null);
                setError(null);
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              error={emailError}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(null);
                setError(null);
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              error={passwordError}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {/* General Error */}
          {error && (
            <View className="bg-error/10 border border-error rounded-xl p-3 mb-4">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          )}

          {/* Sign In Button */}
          <LoadingButton
            title="Sign In"
            onPress={handleSignIn}
            isLoading={isLoading}
            disabled={!isFormValid}
          />

          {/* Sign Up Link */}
          <View className="mt-6 items-center">
            <Pressable onPress={() => router.replace('/(auth)/email-sign-up')}>
              <Text className="text-text-medium">
                Don't have an account?{' '}
                <Text className="text-primary font-semibold">Sign Up</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
