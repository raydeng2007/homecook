import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useEffect, useRef } from 'react';
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
import { formatDateKey } from '@/lib/date-utils';

type CalendarMode = 'month' | 'week';

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

  const [planError, setPlanError] = useState<string | null>(null);

  // BUG FIX: prior code had no request-token guard. Rapidly tapping
  // different dates could land responses out of order, displaying meal
  // plans for the wrong date. Track the latest request and discard stale
  // responses (and stale loading/error state) when they arrive late.
  const loadRequestIdRef = useRef(0);

  const loadMealPlans = useCallback(async () => {
    if (!home?.id) return;
    const requestId = ++loadRequestIdRef.current;
    try {
      setIsLoadingPlans(true);
      setPlanError(null);
      const data = await getMealPlansForDate(home.id, dateKey);
      if (requestId !== loadRequestIdRef.current) return;
      setMealPlans(data);
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load meal plans';
      setPlanError(message);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoadingPlans(false);
      }
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
      Alert.alert('Error', 'Failed to remove meal. Please try again.');
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
            <Pressable onPress={() => setSelectedDate(new Date())} testID="home-today-btn">
              <Text className="text-xs text-primary font-medium">Today</Text>
            </Pressable>

            <View className="flex-row bg-surface-2 rounded-lg overflow-hidden">
              <Pressable
                onPress={() => setCalendarMode('month')}
                testID="home-month-toggle"
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
                testID="home-week-toggle"
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
              testID="home-add-meal-btn"
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
          ) : planError ? (
            <Pressable
              onPress={loadMealPlans}
              className="bg-surface-1 rounded-2xl border border-error/30 p-5 items-center active:bg-surface-2"
            >
              <Text className="text-error text-sm">Failed to load meals</Text>
              <Text className="text-text-disabled text-xs mt-1">Tap to retry</Text>
            </Pressable>
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
                const mealColor = MEAL_TYPE_COLORS[plan.meal_type] ?? '#D9B991';
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
                      className="text-xs font-medium w-18 mr-2"
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
