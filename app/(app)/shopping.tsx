import { View, Text, Pressable, SectionList, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useHome } from '@/contexts/HomeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getMealPlansForRange } from '@/lib/meal-plans';
import {
  guessCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_ORDER,
} from '@/lib/ingredient-categories';
import type { MealPlanWithFullRecipe, Ingredient, IngredientCategory } from '@/types/database';

// ── Helpers ────────────────────────────────────────────────────────────

function getWeekRange(baseDate: Date): { start: Date; end: Date } {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

type AggregatedItem = {
  key: string; // lowercase name + unit
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  recipes: string[]; // recipe titles that need this ingredient
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
    if (!recipe?.ingredients) continue;

    const servingScale = plan.servings / (recipe.servings || 1);

    for (const ing of recipe.ingredients as Ingredient[]) {
      const normName = ing.name.trim().toLowerCase();
      const normUnit = ing.unit.trim().toLowerCase();
      const key = `${normName}||${normUnit}`;

      const qty = parseFloat(ing.quantity) || 0;
      const scaledQty = qty * servingScale;

      const existing = map.get(key);
      if (existing) {
        existing.quantity += scaledQty;
        if (!existing.recipes.includes(recipe.title)) {
          existing.recipes.push(recipe.title);
        }
      } else {
        map.set(key, {
          key,
          name: ing.name.trim(),
          quantity: scaledQty,
          unit: ing.unit.trim(),
          category: guessCategory(ing.name),
          recipes: [recipe.title],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
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
  const { statusBarStyle, textHigh, textDisabled, onPrimary, primary } = useThemeColors();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState<MealPlanWithFullRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const { start, end } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekRange(base);
  }, [weekOffset]);

  const weekLabel = formatWeekLabel(start, end);

  const loadPlans = useCallback(async () => {
    if (!home?.id) return;

    try {
      setIsLoading(true);
      const data = await getMealPlansForRange(
        home.id,
        formatDateKey(start),
        formatDateKey(end)
      );
      setPlans(data);
    } catch (err) {
      console.error('[Shopping] Failed to load plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [home?.id, start, end]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
      setCheckedItems(new Set());
    }, [loadPlans])
  );

  const items = useMemo(() => aggregateIngredients(plans), [plans]);
  const sections = useMemo(() => groupByCategory(items), [items]);

  const checkedCount = checkedItems.size;
  const totalCount = items.length;

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearChecked = () => setCheckedItems(new Set());

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
            className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel="Previous week"
          >
            <Ionicons name="chevron-back" size={18} color={textHigh} />
          </Pressable>

          <View className="items-center">
            <Text className="text-sm text-text-high font-medium">{weekLabel}</Text>
            {weekOffset === 0 && (
              <Text className="text-xs text-secondary mt-0.5">This week</Text>
            )}
          </View>

          <Pressable
            onPress={() => setWeekOffset((o) => o + 1)}
            className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel="Next week"
          >
            <Ionicons name="chevron-forward" size={18} color={textHigh} />
          </Pressable>
        </View>

        {/* Progress + reset */}
        {totalCount > 0 && (
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xs text-text-medium">
              {checkedCount} of {totalCount} items checked
            </Text>
            {checkedCount > 0 && (
              <Pressable onPress={clearChecked}>
                <Text className="text-xs text-primary font-medium">Reset</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-surface-2 items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={40} color={textDisabled} />
          </View>
          <Text className="text-text-medium text-lg text-center">
            No items this week
          </Text>
          <Text className="text-text-disabled text-sm mt-2 text-center max-w-[260px]">
            Plan meals for {weekLabel} and your shopping list will appear here
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
          ListHeaderComponent={
            <View className="flex-row items-center justify-between py-2 mb-1">
              <Text className="text-base font-bold text-text-high">
                Ingredients ({totalCount})
              </Text>
              <Text className="text-xs text-text-medium">
                {plans.length} meal{plans.length !== 1 ? 's' : ''} planned
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center gap-2 mt-4 mb-2 pt-2">
              <View
                className="w-7 h-7 rounded-lg items-center justify-center"
                style={{ backgroundColor: section.color + '25' }}
              >
                <Ionicons
                  name={section.icon as keyof typeof Ionicons.glyphMap}
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
            const checked = checkedItems.has(item.key);
            return (
              <Pressable
                onPress={() => toggleItem(item.key)}
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
                  {checked && <Ionicons name="checkmark" size={16} color={onPrimary} />}
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
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
