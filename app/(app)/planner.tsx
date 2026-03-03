import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHome } from '@/contexts/HomeContext';
import WeekCalendarStrip from '@/components/WeekCalendarStrip';
import MealPlanCard from '@/components/MealPlanCard';
import AddMealModal from '@/components/AddMealModal';
import { getMealPlansForMonth, removeMealPlan } from '@/lib/meal-plans';
import { MEAL_TYPE_COLORS } from '@/types/database';
import type { MealPlanWithRecipe } from '@/types/database';

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PlannerScreen() {
  const { home } = useHome();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [monthMealPlans, setMonthMealPlans] = useState<MealPlanWithRecipe[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!home?.id) return;
    try {
      const plans = await getMealPlansForMonth(
        home.id,
        selectedDate.getFullYear(),
        selectedDate.getMonth()
      );
      setMonthMealPlans(plans);
    } catch (err) {
      console.error('[Planner] Failed to load plans:', err);
    }
  }, [home?.id, selectedDate]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Derive marked dates for calendar dots
  const markedDates = useMemo(() => {
    const marks: Record<string, { dots: { color: string }[] }> = {};
    for (const plan of monthMealPlans) {
      if (!marks[plan.date]) {
        marks[plan.date] = { dots: [] };
      }
      const color = MEAL_TYPE_COLORS[plan.meal_type] ?? '#BB86FC';
      if (!marks[plan.date].dots.some((d) => d.color === color)) {
        marks[plan.date].dots.push({ color });
      }
    }
    return marks;
  }, [monthMealPlans]);

  // Filter plans for the selected date
  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDayPlans = useMemo(
    () => monthMealPlans.filter((p) => p.date === selectedDateKey),
    [monthMealPlans, selectedDateKey]
  );

  const handleDeleteMealPlan = (id: string) => {
    Alert.alert('Remove Meal', 'Remove this meal from your plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMealPlan(id);
            loadPlans();
          } catch (err) {
            console.error('[Planner] Failed to remove:', err);
          }
        },
      },
    ]);
  };

  const goToToday = () => setSelectedDate(new Date());

  const selectedLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View className="screen">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-5 pt-14 pb-4 bg-surface-1 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3 mr-2"
        >
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.87)" />
        </Pressable>
        <Text className="text-xl font-bold text-text-high flex-1">Meal Planner</Text>
      </View>

      {/* Week Calendar Strip */}
      <View className="px-5 pt-4">
        <WeekCalendarStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          markedDates={markedDates}
        />
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 px-5 py-4">
        <Pressable
          onPress={goToToday}
          className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-2 active:bg-surface-3"
        >
          <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.87)" />
          <Text className="text-sm text-text-high">Today</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border border-primary active:bg-surface-3"
        >
          <Ionicons name="add" size={16} color="#BB86FC" />
          <Text className="text-sm text-primary font-medium">Add recipe</Text>
        </Pressable>
      </View>

      {/* Selected day heading */}
      <View className="px-5 mb-2">
        <Text className="section-heading">{selectedLabel}</Text>
      </View>

      {/* Meal plans list */}
      <FlatList
        data={selectedDayPlans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MealPlanCard mealPlan={item} onDelete={handleDeleteMealPlan} />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="card items-center py-8">
            <Ionicons name="restaurant-outline" size={40} color="rgba(255,255,255,0.38)" />
            <Text className="text-text-medium mt-3">No meals planned</Text>
            <Text className="text-xs text-text-disabled mt-1">
              Tap + Add recipe to plan a meal
            </Text>
          </View>
        }
      />

      {/* Add Meal Modal */}
      <AddMealModal
        visible={showAddModal}
        date={selectedDateKey}
        dateLabel={selectedLabel}
        onClose={() => setShowAddModal(false)}
        onAdded={loadPlans}
      />
    </View>
  );
}
