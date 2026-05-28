import { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Icon } from '@/components/Icon';
import { useThemeColors } from '@/hooks/useThemeColors';

// ── Step definitions ──────────────────────────────────────────────────

type OnboardingStep = {
  icon: string;
  title: string;
  description: string;
  tab: string; // route name to navigate to
};

const STEPS: OnboardingStep[] = [
  {
    icon: 'book-outline',
    title: 'Your Cookbook',
    description:
      'Browse, search, and save your favorite recipes. Add your own or discover new ones to try.',
    tab: 'recipes',
  },
  {
    icon: 'calendar-outline',
    title: 'Plan Your Meals',
    description:
      'Assign recipes to any day of the week. Your household can see and plan meals together.',
    tab: 'index',
  },
  {
    icon: 'cart-outline',
    title: 'Shop & Collaborate',
    description:
      'Your shopping list is auto-generated from planned meals. Add custom items and manage your household.',
    tab: 'shopping',
  },
];

// ── Component ─────────────────────────────────────────────────────────

interface OnboardingOverlayProps {
  onComplete: () => void;
  navigateToTab: (name: string) => void;
}

export default function OnboardingOverlay({ onComplete, navigateToTab }: OnboardingOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { primary, isDark } = useThemeColors();

  const cardBg = isDark ? 'rgba(22,18,16,0.92)' : 'rgba(255,255,255,0.92)';
  const backdropBg = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)';

  const step = STEPS[currentIndex];
  const isLast = currentIndex === STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      navigateToTab(STEPS[nextIndex].tab);
    }
  };

  // Navigate to the first step's tab on mount (slight delay for tabs to mount)
  useEffect(() => {
    const timer = setTimeout(() => navigateToTab(STEPS[0].tab), 300);
    return () => clearTimeout(timer);
  }, [navigateToTab]);

  // backdrop-filter is web-only; cast to bypass RN type checking
  const blurStyle = Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any)
    : {};

  return (
    <>
      {/* Backdrop layer — tapping anywhere dismisses */}
      <Pressable
        onPress={onComplete}
        style={[StyleSheet.absoluteFill, { backgroundColor: backdropBg, zIndex: 50 }]}
        accessibilityLabel="Dismiss tutorial"
      />

      {/* Card layer — sits above backdrop */}
      <View
        style={[
          {
            position: 'absolute',
            bottom: 110,
            left: 20,
            right: 20,
            zIndex: 51,
            backgroundColor: cardBg,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(217,185,145,0.15)' : 'rgba(64,1,6,0.15)',
          },
          blurStyle,
        ]}
      >
        {/* Step indicator + skip */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row gap-1.5">
            {STEPS.map((_, i) => (
              <View
                key={i}
                className={`rounded-full ${
                  i === currentIndex ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-surface-5'
                }`}
              />
            ))}
          </View>
          <Pressable
            onPress={onComplete}
            className="px-2 py-1 rounded-lg active:bg-surface-3"
            testID="onboarding-skip-btn"
          >
            <Text className="text-xs text-text-disabled">Skip</Text>
          </Pressable>
        </View>

        {/* Icon + content */}
        <View className="flex-row items-start gap-3">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mt-0.5"
            style={{ backgroundColor: primary + '20' }}
          >
            <Icon name={step.icon} size={20} color={primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-text-high mb-1">
              {step.title}
            </Text>
            <Text className="text-sm text-text-medium leading-5">
              {step.description}
            </Text>
          </View>
        </View>

        {/* Action button */}
        <Pressable
          onPress={goNext}
          className="mt-4 bg-primary py-2.5 rounded-xl items-center active:opacity-80"
          testID="onboarding-next-btn"
        >
          <Text className="text-on-primary font-semibold text-sm">
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
