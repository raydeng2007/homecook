import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHome } from '@/contexts/HomeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import MonthCalendarGrid from '@/components/MonthCalendarGrid';
import WeekCalendarStrip from '@/components/WeekCalendarStrip';
import AddMealModal from '@/components/AddMealModal';
import { getMealPlansForDate, removeMealPlan } from '@/lib/meal-plans';
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS } from '@/types/database';
import type { MealPlanWithRecipe } from '@/types/database';

type CalendarMode = 'month' | 'week';

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const { home } = useHome();
  const router = useRouter();
  const { statusBarStyle, primary, textDisabled } = useThemeColors();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [mealPlans, setMealPlans] = useState<MealPlanWithRecipe[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const dateKey = formatDateKey(selectedDate);
  const dateLabel = formatDateLabel(selectedDate);

  const loadMealPlans = useCallback(async () => {
    if (!home?.id) return;
    try {
      setIsLoadingPlans(true);
      const data = await getMealPlansForDate(home.id, dateKey);
      setMealPlans(data);
    } catch (err) {
      console.error('[Home] Failed to load meal plans:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [home?.id, dateKey]);

  useEffect(() => {
    loadMealPlans();
  }, [loadMealPlans]);

  const handleRecipePress = (id: string) => {
    router.push({ pathname: '/(app)/recipes/[id]', params: { id } });
  };

  const handleRemoveMeal = async (id: string) => {
    try {
      await removeMealPlan(id);
      loadMealPlans();
    } catch (err) {
      console.error('[Home] Failed to remove meal:', err);
    }
  };

  return (
    <View className="screen">
      <StatusBar style={statusBarStyle} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-2">
          <Text className="text-sm text-text-medium">Welcome back,</Text>
          <Text className="text-xl font-bold text-text-high">Chef</Text>
        </View>

        {/* Calendar */}
        <View className="px-5 pt-3 pb-1">
          {calendarMode === 'month' ? (
            <MonthCalendarGrid
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          ) : (
            <WeekCalendarStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              showNavigation
            />
          )}

          {/* Toggle row: Today + View toggle */}
          <View className="flex-row items-center justify-between mt-2.5">
            <Pressable onPress={() => setSelectedDate(new Date())}>
              <Text className="text-xs text-primary font-medium">Today</Text>
            </Pressable>

            <View className="flex-row bg-surface-2 rounded-lg overflow-hidden">
              <Pressable
                onPress={() => setCalendarMode('month')}
                className={`px-3 py-1.5 ${calendarMode === 'month' ? 'bg-surface-4' : ''}`}
              >
                <Text
                  className={`text-xs font-medium ${
                    calendarMode === 'month' ? 'text-primary' : 'text-text-disabled'
                  }`}
                >
                  Month
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCalendarMode('week')}
                className={`px-3 py-1.5 ${calendarMode === 'week' ? 'bg-surface-4' : ''}`}
              >
                <Text
                  className={`text-xs font-medium ${
                    calendarMode === 'week' ? 'text-primary' : 'text-text-disabled'
                  }`}
                >
                  Week
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Meal plans for selected date */}
        <View className="px-5 mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="section-heading">{dateLabel}</Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="flex-row items-center gap-1 active:opacity-70"
            >
              <Ionicons name="add" size={16} color={primary} />
              <Text className="text-xs text-primary font-medium">Add meal</Text>
            </Pressable>
          </View>

          {isLoadingPlans ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color={primary} />
            </View>
          ) : mealPlans.length === 0 ? (
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="bg-surface-1 rounded-2xl border border-border-card p-5 items-center active:bg-surface-2"
            >
              <Text className="text-text-medium text-sm">
                No meals planned for this day
              </Text>
              <Text className="text-text-disabled text-xs mt-1">
                Tap to add one
              </Text>
            </Pressable>
          ) : (
            <View className="bg-surface-1 rounded-2xl border border-border-card overflow-hidden">
              {mealPlans.map((plan, idx) => {
                const mealColor = MEAL_TYPE_COLORS[plan.meal_type] ?? '#BB86FC';
                const mealLabel = MEAL_TYPE_LABELS[plan.meal_type] ?? plan.meal_type;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => handleRecipePress(plan.recipe_id)}
                    className={`flex-row items-center px-4 py-3.5 active:bg-surface-2 ${
                      idx < mealPlans.length - 1 ? 'border-b border-border-subtle' : ''
                    }`}
                  >
                    <Text
                      className="text-xs font-medium w-16"
                      style={{ color: mealColor }}
                    >
                      {mealLabel}
                    </Text>
                    <Text
                      className="flex-1 text-text-high text-sm font-medium"
                      numberOfLines={1}
                    >
                      {plan.recipe?.title ?? 'Unknown recipe'}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={textDisabled} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Meal Modal */}
      <AddMealModal
        visible={showAddModal}
        date={dateKey}
        dateLabel={dateLabel}
        onClose={() => setShowAddModal(false)}
        onAdded={loadMealPlans}
      />
    </View>
  );
}
