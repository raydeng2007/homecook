import { Tabs } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import CustomTabBar from '@/components/CustomTabBar';
import { HomeProvider, useHome } from '@/contexts/HomeContext';

function AppTabs() {
  const { isLoading, error } = useHome();

  if (isLoading) {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text className="text-text-medium mt-4">Setting up your kitchen...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="screen items-center justify-center px-6">
        <Text className="text-error text-lg text-center">{error}</Text>
        <Text className="text-text-medium text-sm mt-2 text-center">
          Please check your connection and try again
        </Text>
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
