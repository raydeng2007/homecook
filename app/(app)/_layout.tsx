import { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs } from 'expo-router';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import { HomeProvider, useHome } from '@/contexts/HomeContext';
import { useThemeColors } from '@/hooks/useThemeColors';

const ONBOARDING_KEY = '@homecook_onboarding_seen';

function AppTabs() {
  const { isLoading, error, refresh } = useHome();
  const { primary, error: errorColor } = useThemeColors();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(val !== 'true');
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  // Use expo-router for tab navigation during onboarding
  const router = useRouter();
  const navigateToTab = useCallback((name: string) => {
    try {
      // Expo Router href paths for tab screens
      const routes: Record<string, string> = {
        index: '/',
        recipes: '/recipes',
        shopping: '/shopping',
        household: '/household',
      };
      router.navigate(routes[name] ?? '/' as any);
    } catch {
      // Ignore if route doesn't exist yet
    }
  }, [router]);

  if (isLoading) {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
        <Text className="text-text-medium mt-4">Setting up your kitchen...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="screen items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-error/15 items-center justify-center mb-4">
          <Ionicons name="cloud-offline-outline" size={36} color={errorColor} />
        </View>
        <Text className="text-error text-lg text-center">{error}</Text>
        <Text className="text-text-medium text-sm mt-2 text-center">
          Please check your connection and try again
        </Text>
        <Pressable
          onPress={refresh}
          className="mt-5 px-6 py-3 rounded-2xl bg-primary active:opacity-80"
        >
          <Text className="text-on-primary font-bold text-sm">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="recipes" options={{ title: 'Cookbook' }} />
        <Tabs.Screen name="shopping" options={{ title: 'Shopping' }} />
        <Tabs.Screen name="household" options={{ title: 'Household' }} />
        <Tabs.Screen name="planner" options={{ href: null }} />
      </Tabs>
      {showOnboarding && (
        <OnboardingOverlay
          onComplete={completeOnboarding}
          navigateToTab={navigateToTab}
        />
      )}
    </View>
  );
}

export default function AppLayout() {
  return (
    <HomeProvider>
      <AppTabs />
    </HomeProvider>
  );
}
