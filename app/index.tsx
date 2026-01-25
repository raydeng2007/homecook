import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function LandingPage() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center px-6">
      <StatusBar style="light" />
      
      {/* Logo */}
      <View className="mb-8">
        <View className="w-24 h-24 bg-zinc-900 rounded-full items-center justify-center">
          <Text className="text-5xl">🍳</Text>
        </View>
      </View>

      {/* Title */}
      <View className="items-center mb-12">
        <Text className="text-5xl font-bold text-white mb-2">
          HomeCook
        </Text>
        <Text className="text-lg text-zinc-400">
          Plan meals together
        </Text>
      </View>

      {/* Features */}
      <View className="w-full gap-4 mb-12">
        <View className="flex-row items-center bg-zinc-900 p-4 rounded-xl">
          <Text className="text-2xl mr-4">📅</Text>
          <Text className="text-base text-white font-medium">
            Calendar meal planning
          </Text>
        </View>
        
        <View className="flex-row items-center bg-zinc-900 p-4 rounded-xl">
          <Text className="text-2xl mr-4">🏠</Text>
          <Text className="text-base text-white font-medium">
            Share with your home
          </Text>
        </View>
        
        <View className="flex-row items-center bg-zinc-900 p-4 rounded-xl">
          <Text className="text-2xl mr-4">📝</Text>
          <Text className="text-base text-white font-medium">
            Auto shopping lists
          </Text>
        </View>
      </View>

      {/* Button */}
      <View className="w-full">
        <Pressable
          className="bg-blue-600 active:bg-blue-700 py-4 rounded-xl items-center"
          onPress={() => console.log('Get Started pressed')}
        >
          <Text className="text-white text-lg font-semibold">
            Get Started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
