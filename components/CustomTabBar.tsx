import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    icon: 'home',
    iconOutline: 'home-outline',
    label: 'Home',
  },
  'recipes/index': {
    icon: 'book',
    iconOutline: 'book-outline',
    label: 'Cookbook',
  },
  shopping: {
    icon: 'cart',
    iconOutline: 'cart-outline',
    label: 'Shopping',
  },
  household: {
    icon: 'people',
    iconOutline: 'people-outline',
    label: 'Household',
  },
};

// Keys in the order tabs should appear
const TAB_ORDER = ['index', 'recipes/index', 'shopping', 'household'];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { textDisabled, primary } = useThemeColors();

  return (
    <View className="bg-surface-1 border-t border-surface-3 flex-row items-end pb-6 pt-2 px-4">
      {TAB_ORDER.map((routeKey) => {
        // Find the matching route in state
        const routeIndex = state.routes.findIndex((r) => {
          if (routeKey === 'recipes/index') return r.name === 'recipes';
          return r.name === routeKey;
        });

        if (routeIndex === -1) return null;

        const route = state.routes[routeIndex];
        const isFocused = state.index === routeIndex;
        const config = TAB_CONFIG[routeKey];

        if (!config) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = isFocused ? config.icon : config.iconOutline;
        const color = isFocused ? primary : textDisabled;

        return (
          <View key={route.key} className="flex-1 items-center">
            <Pressable
              onPress={onPress}
              className="items-center justify-center py-1.5 px-3 min-w-[64px]"
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
            >
              <Ionicons name={iconName} size={22} color={color} />
              <Text
                className={`text-[10px] mt-1 font-medium`}
                style={{ color }}
              >
                {config.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
