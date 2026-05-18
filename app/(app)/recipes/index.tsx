import { View, Text, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRecipesPage, getAllRecipes, getPersonalRecipes } from '@/lib/recipes';
import { getSavedRecipeIds, saveRecipe, unsaveRecipe } from '@/lib/saved-recipes';
import { smartSearch } from '@/lib/recipe-search';
import RecipeDiaryCard from '@/components/RecipeDiaryCard';
import type { Recipe } from '@/types/database';

type CookbookTab = 'public' | 'personal';

// ── Component ──────────────────────────────────────────────────────────

export default function CookbookScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { statusBarStyle, onPrimary, textDisabled, primary, error: errorColor } = useThemeColors();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<CookbookTab>('public');

  // ── Public tab state (paginated) ──
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Personal tab state (fetched as a complete set) ──
  const [personalRecipes, setPersonalRecipes] = useState<Recipe[]>([]);

  // ── Shared state ──
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  // For public search: fetch all recipes once and filter client-side
  const [allRecipesCache, setAllRecipesCache] = useState<Recipe[] | null>(null);
  const isSearching = searchQuery.trim().length > 0;

  // ── Load public tab (first page) + saved IDs ──
  const loadPublicData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setCurrentPage(0);
      setAllRecipesCache(null);

      const { recipes: pageRecipes, hasMore: more, total } = await getRecipesPage(0);
      setPublicRecipes(pageRecipes);
      setHasMore(more);
      setTotalCount(total);

      if (userId) {
        const saved = await getSavedRecipeIds(userId);
        setSavedIds(saved);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ── Load personal tab (own + bookmarked recipes) ──
  const loadPersonalData = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setLoadError(null);

      const [personal, saved] = await Promise.all([
        getPersonalRecipes(userId),
        getSavedRecipeIds(userId),
      ]);
      setPersonalRecipes(personal);
      setSavedIds(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ── Load next public page ──
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isSearching || activeTab !== 'public') return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const { recipes: pageRecipes, hasMore: more } = await getRecipesPage(nextPage);

      setPublicRecipes((prev) => [...prev, ...pageRecipes]);
      setCurrentPage(nextPage);
      setHasMore(more);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more recipes';
      setLoadError(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, isSearching, activeTab]);

  // ── Fetch all for public search ──
  const loadAllForSearch = useCallback(async () => {
    if (allRecipesCache) return;
    try {
      const all = await getAllRecipes();
      setAllRecipesCache(all);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recipes for search';
      setLoadError(message);
    }
  }, [allRecipesCache]);

  // ── Load data on focus ──
  useFocusEffect(
    useCallback(() => {
      // Don't wipe an active search's cache when coming back from recipe
      // detail — users lose their results otherwise. The previously-populated
      // allRecipesCache + publicRecipes + savedIds are still valid from the
      // prior visit; no fresh fetch is required just because focus bounced.
      // See: .planning/quick/260420-s9l-.../260420-s9l-PLAN.md for the full
      // regression description.
      if (searchQuery.trim().length > 0) return;

      if (activeTab === 'public') {
        loadPublicData();
      } else {
        loadPersonalData();
      }
    }, [activeTab, loadPublicData, loadPersonalData, searchQuery])
  );

  // ── Tab switch handler ──
  const handleTabSwitch = useCallback((tab: CookbookTab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setAllRecipesCache(null);
    setLoadError(null);

    // Immediately load the right data
    if (tab === 'public') {
      loadPublicData();
    } else {
      loadPersonalData();
    }
  }, [loadPublicData, loadPersonalData]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 0 && activeTab === 'public') {
      loadAllForSearch();
    }
  }, [loadAllForSearch, activeTab]);

  const handleToggleSave = async (recipeId: string) => {
    if (!userId) return;
    const wasSaved = savedIds.has(recipeId);
    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
    try {
      if (wasSaved) {
        await unsaveRecipe(userId, recipeId);
      } else {
        await saveRecipe(userId, recipeId);
      }
      // Refresh personal recipes if on personal tab (for unsave removing items)
      if (activeTab === 'personal') {
        const personal = await getPersonalRecipes(userId);
        setPersonalRecipes(personal);
      }
    } catch (err) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(recipeId);
        else next.delete(recipeId);
        return next;
      });
    }
  };

  const isOwnRecipe = useCallback(
    (recipe: Recipe) => recipe.created_by === userId,
    [userId]
  );

  // ── Build displayed list based on active tab ──
  const displayedRecipes = useMemo(() => {
    let filtered: Recipe[];

    if (activeTab === 'personal') {
      // Personal tab: data already comes pre-filtered from getPersonalRecipes
      filtered = personalRecipes;
    } else {
      // Public tab: paginated, or full cache when searching
      filtered = isSearching && allRecipesCache ? allRecipesCache : publicRecipes;
    }

    // Apply smart search
    if (searchQuery.trim()) {
      filtered = smartSearch(filtered, searchQuery);
    }

    return filtered;
  }, [activeTab, publicRecipes, personalRecipes, allRecipesCache, searchQuery, isSearching]);

  const handleRecipePress = (id: string) => {
    router.push({ pathname: '/(app)/recipes/[id]', params: { id } });
  };

  const headerCount = isSearching
    ? displayedRecipes.length
    : activeTab === 'personal'
      ? displayedRecipes.length
      : totalCount || displayedRecipes.length;

  return (
    <View className="screen">
      <StatusBar style={statusBarStyle} />

      {/* Header */}
      <View className="px-5 pt-14 pb-3 bg-surface-1 flex-row justify-between items-center">
        <View className="w-10" />
        <Text className="text-xl font-bold text-text-high">Cookbook</Text>
        <Link href="/(app)/recipes/create" asChild>
          <Pressable
            className="w-11 h-11 items-center justify-center rounded-full bg-primary active:bg-primary-variant"
            accessibilityLabel="Create recipe"
          >
            <Ionicons name="add" size={26} color={onPrimary} />
          </Pressable>
        </Link>
      </View>

      {/* Public / Personal sub-tabs */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row bg-surface-2 rounded-xl overflow-hidden">
          <Pressable
            onPress={() => handleTabSwitch('public')}
            testID="cookbook-tab-public"
            className={`flex-1 py-2.5 items-center rounded-xl ${
              activeTab === 'public' ? 'bg-primary' : ''
            }`}
          >
            <Text
              className="text-sm font-semibold text-text-medium"
              style={activeTab === 'public' ? { color: onPrimary } : undefined}
            >
              Public
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch('personal')}
            testID="cookbook-tab-personal"
            className={`flex-1 py-2.5 items-center rounded-xl ${
              activeTab === 'personal' ? 'bg-primary' : ''
            }`}
          >
            <Text
              className="text-sm font-semibold text-text-medium"
              style={activeTab === 'personal' ? { color: onPrimary } : undefined}
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
            onChangeText={handleSearchChange}
            placeholder={
              activeTab === 'public'
                ? 'Search recipes (try "mexican", "chicken")...'
                : 'Search your saved recipes...'
            }
            placeholderTextColor={textDisabled}
            className="flex-1 ml-2 text-text-high text-sm"
            returnKeyType="search"
            testID="cookbook-search-input"
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
          renderItem={({ item, index }) => {
            const ownRecipe = isOwnRecipe(item);
            const isSaved = savedIds.has(item.id);

            // On Personal tab: self-created recipes don't get a bookmark
            // On Public tab: all recipes get a bookmark
            const showBookmark = activeTab === 'public' || !ownRecipe;

            return (
              <View>
                <RecipeDiaryCard
                  recipe={item}
                  index={index}
                  onPress={handleRecipePress}
                />
                {showBookmark && (
                  <Pressable
                    onPress={() => handleToggleSave(item.id)}
                    // BUG FIX: was `top-4` (fixed 16px from top) — visually
                    // anchored to top-right corner, not vertically centered.
                    // Use top: '50%' + transform to center against any card height.
                    className="absolute right-3 w-9 h-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 'rgba(13,12,0,0.6)',
                      top: '50%',
                      transform: [{ translateY: -18 }], // half of h-9 (36px)
                    }}
                    accessibilityLabel={isSaved ? 'Unsave recipe' : 'Save recipe'}
                    hitSlop={6}
                  >
                    <Ionicons
                      name={isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={isSaved ? primary : 'rgba(250,243,235,0.9)'}
                    />
                  </Pressable>
                )}
              </View>
            );
          }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
          }}
          onRefresh={activeTab === 'public' ? loadPublicData : loadPersonalData}
          refreshing={isLoading}
          onEndReached={!isSearching && activeTab === 'public' ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between py-2 mb-1">
              <Text className="text-base font-bold text-text-high">
                {searchQuery
                  ? `Results (${displayedRecipes.length})`
                  : activeTab === 'public'
                    ? `All Recipes (${headerCount})`
                    : `My Recipes (${headerCount})`}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Ionicons
                name={
                  loadError
                    ? 'alert-circle-outline'
                    : searchQuery
                      ? 'search-outline'
                      : activeTab === 'personal'
                        ? 'bookmark-outline'
                        : 'book-outline'
                }
                size={48}
                color={loadError ? errorColor : textDisabled}
              />
              <Text className="text-text-medium mt-4 text-lg">
                {loadError
                  ? 'Failed to load recipes'
                  : searchQuery
                    ? 'No matching recipes'
                    : activeTab === 'personal'
                      ? 'No saved recipes yet'
                      : 'No recipes yet'}
              </Text>
              <Text className="text-xs text-text-disabled mt-1 text-center px-8">
                {loadError
                  ? `Error: ${loadError}\nPull down to retry.`
                  : searchQuery
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
