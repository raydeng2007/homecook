import { View, Text, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAllRecipes } from '@/lib/recipes';
import { getSavedRecipeIds, saveRecipe, unsaveRecipe } from '@/lib/saved-recipes';
import RecipeDiaryCard from '@/components/RecipeDiaryCard';
import type { Recipe } from '@/types/database';

type CookbookTab = 'public' | 'personal';

// ── Smart search: keyword matching across title, description, category, ingredients ──

const CUISINE_KEYWORDS: Record<string, string[]> = {
  mexican: ['taco', 'burrito', 'enchilada', 'quesadilla', 'salsa', 'guacamole', 'tortilla', 'nacho', 'fajita', 'churro', 'tamale'],
  italian: ['pasta', 'pizza', 'risotto', 'lasagna', 'lasagne', 'gnocchi', 'pesto', 'bruschetta', 'tiramisu', 'carbonara', 'bolognese', 'ravioli', 'fettuccine', 'penne', 'spaghetti', 'crostini', 'panzanella', 'caprese'],
  chinese: ['stir fry', 'wok', 'dumpling', 'dim sum', 'fried rice', 'lo mein', 'chow mein', 'kung pao', 'sweet and sour', 'spring roll', 'szechuan', 'mapo'],
  japanese: ['sushi', 'ramen', 'teriyaki', 'tempura', 'miso', 'udon', 'sashimi', 'katsu', 'gyoza', 'onigiri', 'matcha'],
  indian: ['curry', 'tikka', 'masala', 'naan', 'biryani', 'tandoori', 'samosa', 'dal', 'paneer', 'vindaloo', 'korma', 'chutney'],
  thai: ['pad thai', 'curry', 'satay', 'tom yum', 'green curry', 'red curry', 'massaman', 'basil chicken'],
  french: ['croissant', 'ratatouille', 'quiche', 'crepe', 'souffle', 'bouillabaisse', 'coq au vin', 'crème brûlée', 'baguette', 'brioche'],
  mediterranean: ['hummus', 'falafel', 'tabbouleh', 'shawarma', 'pita', 'tzatziki', 'dolma', 'baklava', 'fattoush'],
  american: ['burger', 'bbq', 'barbecue', 'mac and cheese', 'fried chicken', 'cornbread', 'coleslaw', 'hot dog', 'biscuit'],
  korean: ['bibimbap', 'kimchi', 'bulgogi', 'japchae', 'tteokbokki', 'galbi', 'banchan'],
};

function smartSearch(recipes: Recipe[], query: string): Recipe[] {
  const q = query.toLowerCase().trim();
  if (!q) return recipes;

  // Expand cuisine keywords: "mexican" also matches "taco", "burrito", etc.
  const expandedTerms = [q];
  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    if (q.includes(cuisine)) {
      expandedTerms.push(...keywords);
    }
  }

  // Split multi-word queries into individual terms for broader matching
  const queryTerms = q.split(/\s+/).filter(Boolean);

  return recipes.filter((r) => {
    const title = r.title.toLowerCase();
    const desc = r.description.toLowerCase();
    const cat = (r.category ?? '').toLowerCase();
    const ingNames = r.ingredients.map((i) => i.name.toLowerCase()).join(' ');
    const searchable = `${title} ${desc} ${cat} ${ingNames}`;

    // Check expanded terms (cuisine keyword matching)
    for (const term of expandedTerms) {
      if (searchable.includes(term)) return true;
    }

    // Check if ALL individual query terms match somewhere
    if (queryTerms.length > 1) {
      return queryTerms.every((term) => searchable.includes(term));
    }

    return false;
  });
}

// ── Component ──────────────────────────────────────────────────────────

export default function CookbookScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { statusBarStyle, onPrimary, textDisabled, primary } = useThemeColors();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<CookbookTab>('public');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Always fetch all recipes (public cookbook shows everything)
      const allRecipes = await getAllRecipes();
      setRecipes(allRecipes);

      // Fetch saved IDs independently — don't let this block recipe display
      if (userId) {
        const saved = await getSavedRecipeIds(userId);
        setSavedIds(saved);
      }
    } catch (err) {
      console.error('[Cookbook] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggleSave = async (recipeId: string) => {
    if (!userId) return;
    const isSaved = savedIds.has(recipeId);
    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
    try {
      if (isSaved) {
        await unsaveRecipe(userId, recipeId);
      } else {
        await saveRecipe(userId, recipeId);
      }
    } catch (err) {
      console.error('[Cookbook] Save toggle failed:', err);
      // Revert on error
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(recipeId);
        else next.delete(recipeId);
        return next;
      });
    }
  };

  // Filter recipes by active tab + search
  const displayedRecipes = useMemo(() => {
    let filtered = recipes;

    if (activeTab === 'personal') {
      // Personal = user-created OR saved/bookmarked
      filtered = filtered.filter(
        (r) => r.created_by === userId || r.source === 'user' || savedIds.has(r.id)
      );
    }

    // Apply smart search
    if (searchQuery.trim()) {
      filtered = smartSearch(filtered, searchQuery);
    }

    return filtered;
  }, [recipes, activeTab, savedIds, searchQuery, userId]);

  const handleRecipePress = (id: string) => {
    router.push({ pathname: '/(app)/recipes/[id]', params: { id } });
  };

  return (
    <View className="screen">
      <StatusBar style={statusBarStyle} />

      {/* Header */}
      <View className="px-5 pt-14 pb-3 bg-surface-1 flex-row justify-between items-center">
        <View className="w-10" />
        <Text className="text-xl font-bold text-text-high">Cookbook</Text>
        <Link href="/(app)/recipes/create" asChild>
          <Pressable
            className="w-10 h-10 items-center justify-center rounded-full bg-primary active:bg-primary-variant"
            accessibilityLabel="Create recipe"
          >
            <Ionicons name="add" size={22} color={onPrimary} />
          </Pressable>
        </Link>
      </View>

      {/* Public / Personal sub-tabs */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row bg-surface-2 rounded-xl overflow-hidden">
          <Pressable
            onPress={() => { setActiveTab('public'); setSearchQuery(''); }}
            className={`flex-1 py-2.5 items-center rounded-xl ${
              activeTab === 'public' ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === 'public' ? 'text-black' : 'text-text-medium'
              }`}
            >
              Public
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { setActiveTab('personal'); setSearchQuery(''); }}
            className={`flex-1 py-2.5 items-center rounded-xl ${
              activeTab === 'personal' ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === 'personal' ? 'text-black' : 'text-text-medium'
              }`}
            >
              Personal
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View className="px-5 pb-2">
        <View className="search-bar">
          <Ionicons name="search-outline" size={16} color={textDisabled} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === 'public'
                ? 'Search recipes (try "mexican", "chicken")...'
                : 'Search your saved recipes...'
            }
            placeholderTextColor={textDisabled}
            className="flex-1 ml-2 text-text-high text-sm"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={textDisabled} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <FlatList
          data={displayedRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View className="flex-row items-center">
              <View className="flex-1">
                <RecipeDiaryCard
                  recipe={item}
                  index={index}
                  onPress={handleRecipePress}
                />
              </View>
              {/* Save/unsave bookmark button */}
              <Pressable
                onPress={() => handleToggleSave(item.id)}
                className="w-10 h-10 items-center justify-center ml-1"
                accessibilityLabel={savedIds.has(item.id) ? 'Unsave recipe' : 'Save recipe'}
              >
                <Ionicons
                  name={savedIds.has(item.id) ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={savedIds.has(item.id) ? primary : textDisabled}
                />
              </Pressable>
            </View>
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
          }}
          onRefresh={loadData}
          refreshing={isLoading}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between py-2 mb-1">
              <Text className="text-base font-bold text-text-high">
                {searchQuery
                  ? `Results (${displayedRecipes.length})`
                  : activeTab === 'public'
                    ? `All Recipes (${displayedRecipes.length})`
                    : `My Recipes (${displayedRecipes.length})`}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Ionicons
                name={
                  searchQuery
                    ? 'search-outline'
                    : activeTab === 'personal'
                      ? 'bookmark-outline'
                      : 'book-outline'
                }
                size={48}
                color={textDisabled}
              />
              <Text className="text-text-medium mt-4 text-lg">
                {searchQuery
                  ? 'No matching recipes'
                  : activeTab === 'personal'
                    ? 'No saved recipes yet'
                    : 'No recipes yet'}
              </Text>
              <Text className="text-xs text-text-disabled mt-1 text-center px-8">
                {searchQuery
                  ? 'Try different keywords like "chicken", "italian", or an ingredient'
                  : activeTab === 'personal'
                    ? 'Browse Public recipes and tap the bookmark icon to save them here'
                    : 'Tap + to create your first recipe'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
