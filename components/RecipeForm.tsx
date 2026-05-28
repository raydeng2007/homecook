import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { Icon } from '@/components/Icon';
import { FormInput } from '@/components/FormInput';
import { LoadingButton } from '@/components/LoadingButton';
import { useThemeColors } from '@/hooks/useThemeColors';
import IngredientRow from '@/components/IngredientRow';
import type { Ingredient, Recipe } from '@/types/database';

type RecipeFormProps = {
  initialData?: Pick<Recipe, 'title' | 'description' | 'ingredients' | 'instructions' | 'calories' | 'servings'>;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
};

export type RecipeFormData = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string;
  calories: number | null;
  servings: number;
};

const EMPTY_INGREDIENT: Ingredient = { name: '', quantity: '', unit: '' };

export default function RecipeForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel,
}: RecipeFormProps) {
  const { textDisabled, primary } = useThemeColors();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [{ ...EMPTY_INGREDIENT }]
  );
  const [instructions, setInstructions] = useState(initialData?.instructions ?? '');
  const [calories, setCalories] = useState(
    initialData?.calories != null ? String(initialData.calories) : ''
  );
  const [servings, setServings] = useState(
    initialData?.servings ? String(initialData.servings) : '4'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    else if (title.trim().length > 100) newErrors.title = 'Title must be 100 characters or less';
    if (!description.trim()) newErrors.description = 'Description is required';
    else if (description.trim().length > 500) newErrors.description = 'Description must be 500 characters or less';
    if (!instructions.trim()) newErrors.instructions = 'Instructions are required';
    else if (instructions.trim().length > 5000) newErrors.instructions = 'Instructions must be 5000 characters or less';

    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'Add at least one ingredient';
    }

    const servingsNum = parseInt(servings, 10);
    if (isNaN(servingsNum) || servingsNum < 1) {
      newErrors.servings = 'Must be at least 1';
    }

    if (calories.trim()) {
      const caloriesNum = parseInt(calories, 10);
      if (isNaN(caloriesNum) || caloriesNum < 0) {
        newErrors.calories = 'Must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, instructions, ingredients, servings, calories]);

  const handleSubmit = async () => {
    if (!validate()) return;

    const validIngredients = ingredients.filter((i) => i.name.trim());
    const caloriesNum = calories.trim() ? parseInt(calories, 10) : null;
    const servingsNum = parseInt(servings, 10);

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      ingredients: validIngredients,
      instructions: instructions.trim(),
      calories: caloriesNum,
      servings: servingsNum,
    });
  };

  const updateIngredient = (index: number, updated: Ingredient) => {
    setIngredients((prev) => prev.map((item, i) => (i === index ? updated : item)));
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <FormInput
          label="Title"
          placeholder="Recipe name"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          testID="recipe-title-input"
        />

        {/* Description */}
        <FormInput
          label="Description"
          placeholder="A short description of the dish"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          multiline
          numberOfLines={2}
          testID="recipe-desc-input"
        />

        {/* Servings & Calories row */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="Servings"
              placeholder="4"
              value={servings}
              onChangeText={setServings}
              error={errors.servings}
              keyboardType="numeric"
              testID="recipe-servings-input"
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Calories (optional)"
              placeholder="e.g. 450"
              value={calories}
              onChangeText={setCalories}
              error={errors.calories}
              keyboardType="numeric"
              testID="recipe-calories-input"
            />
          </View>
        </View>

        {/* Ingredients */}
        <View className="mt-2 mb-4">
          <Text className="text-sm text-text-medium mb-2 font-medium">
            Ingredients
          </Text>
          {errors.ingredients && (
            <Text className="text-xs text-error mb-2">{errors.ingredients}</Text>
          )}

          {/* Column headers */}
          <View className="flex-row gap-2 mb-1 px-1">
            <Text className="flex-[3] text-xs text-text-disabled">Name</Text>
            <Text className="flex-1 text-xs text-text-disabled text-center">Qty</Text>
            <Text className="flex-1 text-xs text-text-disabled text-center">Unit</Text>
            <View className="w-9" />
          </View>

          {ingredients.map((ingredient, idx) => (
            <IngredientRow
              key={idx}
              ingredient={ingredient}
              onChange={(updated) => updateIngredient(idx, updated)}
              onRemove={() => removeIngredient(idx)}
            />
          ))}

          <Pressable
            onPress={addIngredient}
            className="flex-row items-center gap-2 py-2 mt-1"
          >
            <Icon name="add-circle-outline" size={20} color={primary} />
            <Text className="text-sm text-primary">Add ingredient</Text>
          </Pressable>
        </View>

        {/* Instructions */}
        <View className="mb-6">
          <Text className="text-sm text-text-medium mb-2 font-medium">
            Instructions
          </Text>
          {errors.instructions && (
            <Text className="text-xs text-error mb-2">{errors.instructions}</Text>
          )}
          <TextInput
            className="bg-surface-1 border border-surface-4 px-4 py-3 rounded-xl text-base text-text-high min-h-[120px]"
            placeholder="Step by step instructions..."
            placeholderTextColor={textDisabled}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <LoadingButton
          title={submitLabel}
          onPress={handleSubmit}
          isLoading={isLoading}
          testID="recipe-save-btn"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
