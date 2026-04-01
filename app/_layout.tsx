import { Slot, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import '../global.css';

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
