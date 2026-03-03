import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HexagonShape from '@/components/HexagonShape';
import { useThemeColors } from '@/hooks/useThemeColors';

type MarkedDate = {
  dots: { color: string }[];
};

type MonthCalendarGridProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates?: Record<string, MarkedDate>;
};

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const totalDays = lastDay.getDate();
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export default function MonthCalendarGrid({
  selectedDate,
  onSelectDate,
  markedDates,
}: MonthCalendarGridProps) {
  const { textHigh } = useThemeColors();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const weeks = getMonthGrid(year, month);

  const goToPrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    onSelectDate(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    onSelectDate(next);
  };

  const monthLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View className="bg-surface-1 rounded-2xl px-3 pt-3 pb-2 border border-border-card">
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-2">
        <Pressable
          onPress={goToPrevMonth}
          className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={16} color={textHigh} />
        </Pressable>
        <Text className="text-sm text-text-medium font-medium">{monthLabel}</Text>
        <Pressable
          onPress={goToNextMonth}
          className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={16} color={textHigh} />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View className="flex-row mb-1">
        {DAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text className="text-[10px] text-text-disabled font-medium">{label}</Text>
          </View>
        ))}
      </View>

      {/* Date grid */}
      {weeks.map((week, weekIdx) => (
        <View key={weekIdx} className="flex-row">
          {week.map((date, dayIdx) => {
            if (!date) {
              return <View key={`empty-${dayIdx}`} className="flex-1 items-center py-[3px]" />;
            }

            const selected = isSameDay(date, selectedDate);
            const today = isToday(date);
            const dateKey = formatDateKey(date);
            const dots = markedDates?.[dateKey]?.dots ?? [];

            return (
              <Pressable
                key={dateKey}
                onPress={() => onSelectDate(date)}
                className="flex-1 items-center py-[2px]"
                accessibilityLabel={date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              >
                {selected || today ? (
                  <HexagonShape
                    size={30}
                    backgroundColor={selected ? '#BB86FC' : 'transparent'}
                    borderColor={today && !selected ? 'rgba(187,134,252,0.5)' : undefined}
                    borderWidth={today && !selected ? 1.5 : 0}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? 'text-on-primary' : 'text-primary'
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                  </HexagonShape>
                ) : (
                  <View className="w-[30px] h-[30px] items-center justify-center">
                    <Text className="text-xs font-semibold text-text-high">
                      {date.getDate()}
                    </Text>
                  </View>
                )}
                {/* Dot indicator */}
                {dots.length > 0 && (
                  <View className="flex-row gap-px mt-px">
                    {dots.slice(0, 2).map((dot, dotIdx) => (
                      <View
                        key={dotIdx}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: dot.color }}
                      />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
