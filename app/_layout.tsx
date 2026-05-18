import { Slot, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
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
  // Load Ionicons font from LOCAL assets (./assets/fonts/Ionicons.ttf).
  //
  // History of this bug: production Android builds shipped with blank icons
  // even after we added the expo-font config plugin. Root cause: the plugin
  // was pointed at `./node_modules/.../Ionicons.ttf` and the spread
  // `{ ...Ionicons.font }` registers the font via require('node_modules/...'),
  // both of which are unreliable for Metro's asset registry in production
  // AABs. Asset references must live in the project's own `assets/` tree to
  // be reliably bundled.
  //
  // Fix: copy the .ttf into ./assets/fonts/, point both the plugin (in
  // app.json) AND useFonts here at that local path. The font is registered
  // under the EXACT name 'ionicons' (lowercase) — matching what createIconSet
  // checks via Font.isLoaded('ionicons').
  //
  // Capture the error so a font load failure doesn't brick the app — we'd
  // rather render with blank icons for a moment than show a frozen splash.
  const [fontsLoaded, fontError] = useFonts({
    ionicons: require('../assets/fonts/Ionicons.ttf'),
  });

  // Hide the splash screen as soon as fonts are loaded OR fail to load.
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Safety net: force-hide the splash after 3 seconds no matter what.
  // Protects against any scenario where useFonts hangs in production builds
  // (asset bundling glitch, native module init issue, etc.) — without this,
  // a font-load hang would leave users staring at a frozen splash forever.
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Render the app even if fonts haven't loaded yet. Icons may briefly render
  // as blank squares, but the app stays usable. Blocking on fonts caused
  // production hangs on Android (frozen splash, app unresponsive).
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
