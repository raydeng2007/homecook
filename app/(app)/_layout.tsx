import { Tabs } from 'expo-router';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '@/components/CustomTabBar';
import { HomeProvider, useHome } from '@/contexts/HomeContext';
import { useThemeColors } from '@/hooks/useThemeColors';

function AppTabs() {
  const { isLoading, error, refresh } = useHome();
  const { primary, error: errorColor } = useThemeColors();

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
  );
}

export default function AppLayout() {
  return (
    <HomeProvider>
      <AppTabs />
    </HomeProvider>
  );
}
