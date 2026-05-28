import { Slot, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import '../global.css';

// Icons are now SVG components rendered via react-native-svg (see components/Icon.tsx).
// No font loading needed — this fixed the production icon-rendering bug that
// plagued releases 1.3.0 through 1.3.6, where the Ionicons font failed to
// register with the native font registry in production AAB/IPA builds while
// working fine in Expo Go (which has Ionicons pre-baked into its own binary).

function ThemeRoot({ children }: { children: React.ReactNode }) {
  const { themeVars } = useTheme();
  return (
    <View style={[{ flex: 1 }, themeVars]}>
      {children}
    </View>
  );
}

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [session, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ThemeRoot>
            <RootLayoutNav />
          </ThemeRoot>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
