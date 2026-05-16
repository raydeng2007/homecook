import { Slot, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import '../global.css';

// Keep the splash screen visible until fonts are loaded.
// Without this, the app would render with the Ionicons font missing,
// showing blank circles where every icon should be (tab bar, bookmarks,
// chevrons, etc.) — which is exactly what production builds were doing.
SplashScreen.preventAutoHideAsync().catch(() => {});

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
  // BUG FIX: Ionicons font was never explicitly loaded. In production builds,
  // every icon (tab bar, bookmarks, chevrons, search, etc.) rendered as blank
  // because the font hadn't downloaded before the component mounted. Force-load
  // the font here and gate rendering until it's ready.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
