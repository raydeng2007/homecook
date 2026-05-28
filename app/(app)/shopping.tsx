import { View, Text, Pressable, SectionList, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '@/components/Icon';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useHome } from '@/contexts/HomeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getMealPlansForRange } from '@/lib/meal-plans';
import {
  getShoppingItems,
  addManualItem,
  excludeIngredient,
  renameItem,
  setItemChecked,
  removeItem,
  subscribeToShoppingItems,
  type ShoppingItem,
} from '@/lib/shopping-items';
import {
  guessCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_ORDER,
} from '@/lib/ingredient-categories';
import {
  normalizeIngredient,
  pickDisplayName,
  splitCompound,
  isPantryStaple,
  normalizeUnitForKey,
} from '@/lib/ingredient-normalize';
import type { MealPlanWithFullRecipe, Ingredient, NormalizedIngredient, IngredientCategory } from '@/types/database';
import { formatDateKey, getWeekRange, formatWeekLabel } from '@/lib/date-utils';

// ── Helpers ────────────────────────────────────────────────────────────

type AggregatedItem = {
  key: string; // normalized name + unit
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  recipes: string[]; // recipe titles that need this ingredient
  _rawNames: string[]; // raw variants for display name picking
};

type ShoppingSection = {
  category: IngredientCategory;
  title: string;
  icon: string;
  color: string;
  data: AggregatedItem[];
};

function aggregateIngredients(plans: MealPlanWithFullRecipe[]): AggregatedItem[] {
  const map = new Map<string, AggregatedItem>();

  for (const plan of plans) {
    const { recipe } = plan;
    if (!recipe) continue;

    // BUG FIX: previously this used `??` on the left and `||` on the right.
    // When recipe.servings === 0, the left side returned 0 (?? doesn't catch
    // zero), the right side fell through to 1, giving 0 / 1 = 0 — silently
    // zeroing every ingredient in the recipe. Use `||` on both sides so a
    // zero/missing servings count always falls back to 1 (no scaling).
    const recipeServings = recipe.servings || 1;
    const planServings = plan.servings || recipeServings;
    const servingScale = planServings / recipeServings;

    // Prefer server-normalized ingredients when available, fall back to client-side
    const useServerNormalized = !!recipe.normalized_ingredients?.length;
    const ingredients = useServerNormalized
      ? (recipe.normalized_ingredients as NormalizedIngredient[])
      : (recipe.ingredients as Ingredient[] | null) ?? [];

    for (const ing of ingredients) {
      if (!ing.name) continue;

      // Server data has name=canonical + raw_name; client data needs normalizeIngredient()
      const rawName = ('raw_name' in ing ? (ing as NormalizedIngredient).raw_name : ing.name)?.trim() ?? '';
      const normName = useServerNormalized ? ing.name : normalizeIngredient(rawName);
      if (!normName) continue;

      // Layer 1: Split compounds like "salt and pepper" → separate items
      const parts = splitCompound(normName);
      const resolvedParts = parts
        ? parts.map((p) => ({
            normName: p.name,
            rawName: p.name,
            unit: p.unit,
            qty: 0, // compound splits have no meaningful quantity
            cat: guessCategory(p.name),
          }))
        : [{
            normName,
            rawName,
            unit: (ing.unit ?? '').trim(),
            qty: parseFloat(ing.quantity) || 0,
            cat: (useServerNormalized && 'category' in ing
              ? (ing.category as IngredientCategory)
              : guessCategory(rawName)),
          }];

      for (const part of resolvedParts) {
        // Layer 2: Skip pantry staples (salt, pepper, olive oil, water)
        if (isPantryStaple(part.normName)) continue;

        // Layer 3: Normalize units so "2 large banana" + "3 banana" merge
        const normUnit = normalizeUnitForKey(part.unit);
        const key = `${part.normName}||${normUnit}`;
        const scaledQty = part.qty * servingScale;

        const existing = map.get(key);
        if (existing) {
          existing.quantity += scaledQty;
          existing._rawNames.push(part.rawName);
          if (!existing.recipes.includes(recipe.title)) {
            existing.recipes.push(recipe.title);
          }
        } else {
          map.set(key, {
            key,
            name: part.rawName,
            quantity: Number.isFinite(scaledQty) ? scaledQty : 0,
            unit: normUnit || part.unit,
            category: part.cat,
            recipes: [recipe.title],
            _rawNames: [part.rawName],
          });
        }
      }
    }
  }

  // Pick the best display name from raw variants
  const results = Array.from(map.values());
  for (const item of results) {
    item.name = pickDisplayName(item._rawNames);
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

function groupByCategory(items: AggregatedItem[]): ShoppingSection[] {
  const groups = new Map<IngredientCategory, AggregatedItem[]>();

  for (const item of items) {
    const existing = groups.get(item.category);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(item.category, [item]);
    }
  }

  // Return in defined order, only categories that have items
  return CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => ({
      category: cat,
      title: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
      color: CATEGORY_COLORS[cat],
      data: groups.get(cat)!,
    }));
}

function formatQuantity(qty: number): string {
  if (qty === 0) return '';
  if (Number.isInteger(qty)) return String(qty);
  return qty.toFixed(1).replace(/\.0$/, '');
}

// ── Component ──────────────────────────────────────────────────────────

export default function ShoppingScreen() {
  const { home } = useHome();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { statusBarStyle, textHigh, textDisabled, onPrimary, primary, error: errorColor } = useThemeColors();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState<MealPlanWithFullRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── DB-backed shopping items (manual adds + excluded recipe ingredients) ──
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  const { start, end } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekRange(base);
  }, [weekOffset]);

  const weekLabel = formatWeekLabel(start, end);
  const weekStartKey = useMemo(() => formatDateKey(start), [start]);

  // Recipe ingredients use local checked state (ephemeral, device-local).
  // Manual items use DB-backed checked state (synced across household).
  const [recipeChecked, setRecipeChecked] = useState<Set<string>>(new Set());

  // BUG FIX: previously recipeChecked was never reset when switching weeks,
  // so an item checked in week A would appear checked in week B if the keys
  // happened to match (e.g. "milk||gal" on a recurring weekly meal plan).
  useEffect(() => {
    setRecipeChecked(new Set());
  }, [weekStartKey]);

  // Derived: manual items + excluded keys
  const manualItems = useMemo(
    () => shoppingItems.filter((i) => i.kind === 'manual'),
    [shoppingItems]
  );
  const excludedKeys = useMemo(
    () => new Set(shoppingItems.filter((i) => i.kind === 'excluded').map((i) => i.name)),
    [shoppingItems]
  );

  // ── Loaders ──

  const loadPlans = useCallback(async (silent = false) => {
    if (!home?.id) return;

    try {
      if (!silent) setIsLoading(true);
      setLoadError(null);
      const data = await getMealPlansForRange(home.id, formatDateKey(start), formatDateKey(end));
      setPlans(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load shopping list';
      setLoadError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [home?.id, start, end]);

  const [shoppingItemsError, setShoppingItemsError] = useState<string | null>(null);

  const loadShoppingItems = useCallback(async () => {
    if (!home?.id) return;
    try {
      setShoppingItemsError(null);
      const items = await getShoppingItems(home.id, weekStartKey);
      setShoppingItems(items);
    } catch (err) {
      // BUG FIX: previously errors were swallowed with console.warn, leaving
      // users with a mysterious empty shopping list when the migration hadn't
      // been run, RLS blocked the query, or the network failed. Surface the
      // error so we can diagnose what actually broke.
      const message = err instanceof Error ? err.message : 'Failed to load shopping items';
      setShoppingItemsError(message);
      console.warn('Failed to load shopping items', err);
    }
  }, [home?.id, weekStartKey]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
      loadShoppingItems();
    }, [loadPlans, loadShoppingItems])
  );

  // ── Realtime subscription — sync across household members ──
  useEffect(() => {
    if (!home?.id) return;
    const channel = subscribeToShoppingItems(home.id, () => {
      loadShoppingItems();
    });
    return () => {
      channel.unsubscribe();
    };
  }, [home?.id, loadShoppingItems]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPlans(true);
    loadShoppingItems();
  }, [loadPlans, loadShoppingItems]);

  // Filter out excluded ingredients from auto-generated items
  const items = useMemo(() => {
    return aggregateIngredients(plans).filter((it) => !excludedKeys.has(it.key));
  }, [plans, excludedKeys]);
  const sections = useMemo(() => groupByCategory(items), [items]);

  const totalCount = items.length + manualItems.length;
  const actualCheckedCount =
    manualItems.filter((i) => i.checked).length + recipeChecked.size;

  // ── Actions ──

  const handleAddManualItem = async () => {
    const trimmed = newItemText.trim();
    if (!trimmed || !home?.id || !userId) return;
    try {
      await addManualItem(home.id, weekStartKey, trimmed, userId);
      // BUG FIX: previously the input was cleared BEFORE the await, so any
      // network/RLS error wiped the user's typed text with no way to recover.
      // Only clear after the insert actually succeeds.
      setNewItemText('');
      // Realtime will pick it up; reload as fallback
      loadShoppingItems();
    } catch (err) {
      Alert.alert('Could not add item', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleToggleManual = async (item: ShoppingItem) => {
    // Optimistic update
    setShoppingItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
    );
    try {
      await setItemChecked(item.id, !item.checked);
    } catch {
      // Revert on error
      loadShoppingItems();
    }
  };

  const handleToggleRecipe = (key: string) => {
    setRecipeChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRemoveManual = async (item: ShoppingItem) => {
    setShoppingItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await removeItem(item.id);
    } catch {
      loadShoppingItems();
    }
  };

  const handleEditManual = (item: ShoppingItem) => {
    Alert.prompt(
      'Edit Item',
      'Update the item name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const trimmed = value?.trim();
            if (!trimmed || trimmed === item.name) return;
            // Optimistic update
            setShoppingItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, name: trimmed } : i))
            );
            try {
              await renameItem(item.id, trimmed);
            } catch {
              loadShoppingItems();
            }
          },
        },
      ],
      'plain-text',
      item.name
    );
  };

  const handleHideRecipeItem = (item: AggregatedItem) => {
    if (!home?.id || !userId) return;
    Alert.alert(
      'Remove from list?',
      `"${item.name}" will be hidden from this week's shopping list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await excludeIngredient(home.id, weekStartKey, item.key, userId);
              loadShoppingItems();
            } catch (err) {
              Alert.alert('Could not remove item', err instanceof Error ? err.message : 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const clearChecked = async () => {
    // Uncheck local recipe checks
    setRecipeChecked(new Set());
    // Uncheck all manual items in DB
    const toUncheck = manualItems.filter((i) => i.checked);
    setShoppingItems((prev) => prev.map((i) => (i.checked ? { ...i, checked: false } : i)));
    for (const item of toUncheck) {
      try {
        await setItemChecked(item.id, false);
      } catch {
        // Best effort; realtime will reconcile
      }
    }
  };

  return (
    <View className="screen">
      <StatusBar style={statusBarStyle} />

      {/* Header */}
      <View className="px-5 pt-14 pb-3 bg-surface-1">
        <Text className="text-xl font-bold text-text-high">Shopping List</Text>
      </View>

      {/* Week navigation */}
      <View className="px-5 py-3">
        <View className="bg-surface-1 rounded-2xl p-3 border border-border-card flex-row items-center justify-between">
          <Pressable
            onPress={() => setWeekOffset((o) => o - 1)}
            testID="shopping-prev-week"
            className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel="Previous week"
          >
            <Icon name="chevron-back" size={18} color={textHigh} />
          </Pressable>

          <View className="items-center">
            <Text testID="shopping-week-label" className="text-sm text-text-high font-medium">{weekLabel}</Text>
            {weekOffset === 0 && (
              <Text className="text-xs text-secondary mt-0.5">This week</Text>
            )}
          </View>

          <Pressable
            onPress={() => setWeekOffset((o) => o + 1)}
            testID="shopping-next-week"
            className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel="Next week"
          >
            <Icon name="chevron-forward" size={18} color={textHigh} />
          </Pressable>
        </View>

        {/* Progress + reset */}
        {totalCount > 0 && (
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xs text-text-medium">
              {actualCheckedCount} of {totalCount} items checked
            </Text>
            {actualCheckedCount > 0 && (
              <Pressable onPress={clearChecked} testID="shopping-reset-btn">
                <Text className="text-xs text-primary font-medium">Reset</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Add item input */}
      <View className="px-5 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 search-bar">
            <Icon name="add-circle-outline" size={16} color={textDisabled} />
            <TextInput
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="Add item (e.g. milk, paper towels)..."
              placeholderTextColor={textDisabled}
              className="flex-1 ml-2 text-text-high text-sm"
              returnKeyType="done"
              onSubmitEditing={handleAddManualItem}
              testID="shopping-add-input"
            />
          </View>
          {newItemText.trim().length > 0 && (
            <Pressable
              onPress={handleAddManualItem}
              className="bg-primary px-4 py-2.5 rounded-xl active:bg-primary-variant"
              testID="shopping-add-btn"
            >
              <Text className="text-on-primary text-sm font-semibold">Add</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Shopping items error banner — surfaces RLS/migration/network failures
          that were previously silently swallowed (BUG D fix). */}
      {shoppingItemsError && (
        <View className="mx-5 mb-2 px-3 py-2 rounded-xl bg-error/15 border border-error/30 flex-row items-start gap-2">
          <Icon name="alert-circle" size={16} color={errorColor} />
          <View className="flex-1">
            <Text className="text-error text-xs font-semibold">
              Couldn't sync shared items
            </Text>
            <Text className="text-text-medium text-xs mt-0.5" numberOfLines={3}>
              {shoppingItemsError}
            </Text>
          </View>
          <Pressable
            onPress={loadShoppingItems}
            className="px-2 py-1 rounded-lg active:bg-surface-3"
            testID="shopping-items-retry"
          >
            <Text className="text-primary text-xs font-medium">Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-error/15 items-center justify-center mb-4">
            <Icon name="alert-circle-outline" size={40} color={errorColor} />
          </View>
          <Text className="text-error text-lg text-center">
            Failed to load shopping list
          </Text>
          <Text className="text-text-disabled text-sm mt-2 text-center max-w-[260px]">
            {loadError}
          </Text>
          <Pressable
            onPress={() => loadPlans()}
            className="mt-4 px-4 py-2 rounded-lg bg-surface-3 active:bg-surface-5"
          >
            <Text className="text-primary text-sm font-medium">Try Again</Text>
          </Pressable>
        </View>
      ) : totalCount === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-surface-2 items-center justify-center mb-4">
            <Icon name="cart-outline" size={40} color={textDisabled} />
          </View>
          <Text className="text-text-medium text-lg text-center">
            No items this week
          </Text>
          <Text className="text-text-disabled text-sm mt-2 text-center max-w-[260px]">
            Plan meals or add items above to build your shopping list
          </Text>
          {weekOffset !== 0 && (
            <Pressable
              onPress={() => setWeekOffset(0)}
              className="mt-4 px-4 py-2 rounded-lg bg-surface-3 active:bg-surface-5"
            >
              <Text className="text-primary text-sm font-medium">Go to this week</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={primary}
              colors={[primary]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Manual items section */}
              {manualItems.length > 0 && (
                <View className="mb-2">
                  <View className="flex-row items-center gap-2 mt-2 mb-2 pt-2">
                    <View
                      className="w-7 h-7 rounded-lg items-center justify-center"
                      style={{ backgroundColor: primary + '25' }}
                    >
                      <Icon name="create-outline" size={14} color={primary} />
                    </View>
                    <Text className="text-sm font-semibold text-primary">
                      Added Items
                    </Text>
                    <Text className="text-xs text-text-disabled">
                      ({manualItems.length})
                    </Text>
                  </View>
                  {manualItems.map((item) => {
                    const checked = item.checked;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleToggleManual(item)}
                        onLongPress={() => handleEditManual(item)}
                        className={`flex-row items-center py-3 border-b border-border-subtle ${
                          checked ? 'opacity-50' : ''
                        }`}
                      >
                        <View
                          className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                            checked ? 'bg-primary border-primary' : 'border-text-disabled'
                          }`}
                        >
                          {checked && <Icon name="checkmark" size={16} color={onPrimary} />}
                        </View>
                        <Text
                          className={`flex-1 text-base ${
                            checked ? 'text-text-disabled line-through' : 'text-text-high'
                          }`}
                        >
                          {item.name}
                        </Text>
                        <Pressable
                          onPress={() => handleEditManual(item)}
                          className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
                          accessibilityLabel={`Edit ${item.name}`}
                          hitSlop={6}
                        >
                          <Icon name="pencil" size={14} color={textDisabled} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleRemoveManual(item)}
                          className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
                          accessibilityLabel={`Remove ${item.name}`}
                          hitSlop={6}
                        >
                          <Icon name="close-circle" size={18} color={textDisabled} />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Recipe ingredients header */}
              {items.length > 0 && (
                <View className="flex-row items-center justify-between py-2 mb-1">
                  <Text className="text-base font-bold text-text-high">
                    Ingredients ({items.length})
                  </Text>
                  <Text className="text-xs text-text-medium">
                    {plans.length} meal{plans.length !== 1 ? 's' : ''} planned
                  </Text>
                </View>
              )}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center gap-2 mt-4 mb-2 pt-2">
              <View
                className="w-7 h-7 rounded-lg items-center justify-center"
                style={{ backgroundColor: section.color + '25' }}
              >
                <Icon
                  name={section.icon as string}
                  size={14}
                  color={section.color}
                />
              </View>
              <Text className="text-sm font-semibold" style={{ color: section.color }}>
                {section.title}
              </Text>
              <Text className="text-xs text-text-disabled">
                ({section.data.length})
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const checked = recipeChecked.has(item.key);
            return (
              <Pressable
                onPress={() => handleToggleRecipe(item.key)}
                onLongPress={() => handleHideRecipeItem(item)}
                className={`flex-row items-center py-3 border-b border-border-subtle ${
                  checked ? 'opacity-50' : ''
                }`}
              >
                {/* Checkbox */}
                <View
                  className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                    checked ? 'bg-primary border-primary' : 'border-text-disabled'
                  }`}
                >
                  {checked && <Icon name="checkmark" size={16} color={onPrimary} />}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <Text
                    className={`text-base ${
                      checked ? 'text-text-disabled line-through' : 'text-text-high'
                    }`}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs text-text-disabled mt-0.5">
                    {item.recipes.join(', ')}
                  </Text>
                </View>

                {/* Quantity */}
                <Text className={`text-sm font-medium ml-2 ${
                  checked ? 'text-text-disabled' : 'text-secondary'
                }`}>
                  {formatQuantity(item.quantity)}{item.unit ? ` ${item.unit}` : ''}
                </Text>

                {/* Remove (X) */}
                <Pressable
                  onPress={() => handleHideRecipeItem(item)}
                  className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3 ml-1"
                  accessibilityLabel={`Remove ${item.name}`}
                  hitSlop={6}
                >
                  <Icon name="close-circle-outline" size={18} color={textDisabled} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
