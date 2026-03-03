import { ScrollView, Text, Pressable } from 'react-native';

type CategoryChipsProps = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
};

export default function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {categories.map((cat) => {
        const isActive = selected === cat || (cat === 'All' && selected === null);

        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat === 'All' ? null : cat)}
            className={`px-4 py-2 rounded-full ${
              isActive
                ? 'bg-primary'
                : 'bg-surface-2'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isActive ? 'text-on-primary' : 'text-text-medium'
              }`}
            >
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
