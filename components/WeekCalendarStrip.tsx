import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HexagonShape from '@/components/HexagonShape';
import { useThemeColors } from '@/hooks/useThemeColors';

type MarkedDate = {
  dots: { color: string }[];
};

type WeekCalendarStripProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates?: Record<string, MarkedDate>;
  showNavigation?: boolean;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDays(baseDate: Date): Date[] {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export default function WeekCalendarStrip({
  selectedDate,
  onSelectDate,
  markedDates,
  showNavigation = true,
}: WeekCalendarStripProps) {
  const { textHigh } = useThemeColors();
  const weekDays = getWeekDays(selectedDate);

  const goToPrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    onSelectDate(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    onSelectDate(next);
  };

  return (
    <View className="bg-surface-1 rounded-2xl p-4 border border-border-card">
      {/* Week navigation */}
      {showNavigation && (
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={goToPrevWeek}
            className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel="Previous week"
          >
            <Ionicons name="chevron-back" size={18} color={textHigh} />
          </Pressable>
          <Text className="text-sm text-text-medium font-medium">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Pressable
            onPress={goToNextWeek}
            className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
            accessibilityLabel="Next week"
          >
            <Ionicons name="chevron-forward" size={18} color={textHigh} />
          </Pressable>
        </View>
      )}

      {/* Day columns */}
      <View className="flex-row">
        {weekDays.map((date, idx) => {
          const selected = isSameDay(date, selectedDate);
          const today = isToday(date);
          const dateKey = formatDateKey(date);
          const dots = markedDates?.[dateKey]?.dots ?? [];

          return (
            <Pressable
              key={dateKey}
              onPress={() => onSelectDate(date)}
              className="flex-1 items-center py-1"
              accessibilityLabel={date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            >
              {/* Day label */}
              <Text
                className={`text-xs mb-1.5 ${
                  selected ? 'text-primary font-bold' : today ? 'text-secondary font-medium' : 'text-text-medium'
                }`}
              >
                {DAY_LABELS[idx]}
              </Text>

              {/* Date number in hexagon — medium size */}
              {selected || today ? (
                <HexagonShape
                  size={40}
                  backgroundColor={selected ? '#BB86FC' : 'transparent'}
                  borderColor={today && !selected ? 'rgba(187,134,252,0.5)' : undefined}
                  borderWidth={today && !selected ? 2 : 0}
                >
                  <Text
                    className={`text-base font-bold ${
                      selected ? 'text-on-primary' : 'text-primary'
                    }`}
                  >
                    {date.getDate()}
                  </Text>
                </HexagonShape>
              ) : (
                <View className="w-10 h-10 items-center justify-center">
                  <Text className="text-base font-bold text-text-high">
                    {date.getDate()}
                  </Text>
                </View>
              )}

              {/* Dots for marked dates */}
              {dots.length > 0 && (
                <View className="flex-row gap-0.5 mt-1">
                  {dots.slice(0, 3).map((dot, dotIdx) => (
                    <View
                      key={dotIdx}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: dot.color }}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
