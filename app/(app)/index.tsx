import { View, Text, FlatList, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';

type Recipe = {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  servings: number;
};

const PLACEHOLDER_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with eggs, cheese, and pancetta',
    cookTime: '25 min',
    servings: 4,
  },
  {
    id: '2',
    title: 'Chicken Tikka Masala',
    description: 'Creamy tomato curry with tender spiced chicken',
    cookTime: '45 min',
    servings: 4,
  },
  {
    id: '3',
    title: 'Greek Salad',
    description: 'Fresh vegetables with feta cheese and olive oil dressing',
    cookTime: '10 min',
    servings: 2,
  },
  {
    id: '4',
    title: 'Beef Tacos',
    description: 'Seasoned ground beef with fresh toppings in corn tortillas',
    cookTime: '30 min',
    servings: 4,
  },
  {
    id: '5',
    title: 'Mushroom Risotto',
    description: 'Creamy arborio rice with mixed mushrooms and parmesan',
    cookTime: '40 min',
    servings: 3,
  },
  {
    id: '6',
    title: 'Teriyaki Salmon',
    description: 'Pan-seared salmon glazed with homemade teriyaki sauce',
    cookTime: '20 min',
    servings: 2,
  },
];

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Pressable className="card mb-3 active:bg-surface-3">
      <Text className="text-lg font-semibold text-text-high mb-1">
        {recipe.title}
      </Text>
      <Text className="text-sm text-text-medium mb-2">
        {recipe.description}
      </Text>
      <View className="flex-row gap-4">
        <Text className="text-xs text-primary">{recipe.cookTime}</Text>
        <Text className="text-xs text-secondary">
          {recipe.servings} servings
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <View className="screen">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-surface-1">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-sm text-text-medium">Welcome back,</Text>
            <Text className="text-xl font-bold text-text-high">
              {session?.user?.user_metadata?.full_name ?? 'Chef'}
            </Text>
          </View>
          <Pressable
            onPress={handleSignOut}
            className="px-3 py-2 rounded-lg bg-surface-3 active:bg-surface-5"
          >
            <Text className="text-sm text-text-medium">Sign Out</Text>
          </Pressable>
        </View>
      </View>

      {/* Recipe List */}
      <FlatList
        data={PLACEHOLDER_RECIPES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <Text className="heading-2 mb-4">Your Recipes</Text>
        }
      />
    </View>
  );
}
