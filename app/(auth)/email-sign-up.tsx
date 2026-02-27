import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { FormInput } from '@/components/FormInput';
import { LoadingButton } from '@/components/LoadingButton';
import { signUpWithEmail } from '@/lib/auth';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
} from '@/lib/validation';

export default function EmailSignUpScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field-level errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const nameErr = validateName(fullName);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validatePasswordMatch(password, confirmPassword);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    return !nameErr && !emailErr && !passwordErr && !confirmErr;
  };

  const handleSignUp = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUpWithEmail(email, password, fullName || undefined);
      console.log('[SignUp] Result:', JSON.stringify(result));

      if (!result.success && result.error) {
        setError(result.error);
      } else if (result.success) {
        // Navigate to confirmation screen on successful sign-up
        console.log('[SignUp] Navigating to confirmation screen');
        router.replace({
          pathname: '/(auth)/email-confirmation',
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (err) {
      console.error('[SignUp] Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    email.trim() && password && confirmPassword && password === confirmPassword;

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
            Create Account
          </Text>
          <Text className="text-text-medium mb-8">
            Join Homecook to start planning meals with your household.
          </Text>

          {/* Form */}
          <View>
            <FormInput
              label="Full Name (optional)"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setNameError(null);
                setError(null);
              }}
              onBlur={() => setNameError(validateName(fullName))}
              error={nameError}
              placeholder="John Doe"
              autoCapitalize="words"
              autoComplete="name"
            />

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
                // Re-validate confirm password when password changes
                if (confirmPassword) {
                  setConfirmPasswordError(validatePasswordMatch(text, confirmPassword));
                }
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              error={passwordError}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
            />

            <FormInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError(null);
                setError(null);
              }}
              onBlur={() =>
                setConfirmPasswordError(validatePasswordMatch(password, confirmPassword))
              }
              error={confirmPasswordError}
              placeholder="Re-enter your password"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {/* General Error */}
          {error && (
            <View className="bg-error/10 border border-error rounded-xl p-3 mb-4">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          )}

          {/* Sign Up Button */}
          <LoadingButton
            title="Create Account"
            onPress={handleSignUp}
            isLoading={isLoading}
            disabled={!isFormValid}
          />

          {/* Sign In Link */}
          <View className="mt-6 items-center">
            <Pressable onPress={() => router.replace('/(auth)/email-sign-in')}>
              <Text className="text-text-medium">
                Already have an account?{' '}
                <Text className="text-primary font-semibold">Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
