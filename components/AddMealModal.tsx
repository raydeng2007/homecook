import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useHome } from '@/contexts/HomeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTheme } from '@/contexts/ThemeContext';
import { getPersonalRecipes } from '@/lib/recipes';
import { addMealPlan } from '@/lib/meal-plans';
import { scaleCalories, caloriesPerServing } from '@/lib/portion-scaling';
import RecipeImage from '@/components/RecipeImage';
import MealTypeTabBar from '@/components/MealTypeTabBar';
import ServingStepper from '@/components/ServingStepper';
import type { Recipe, MealType } from '@/types/database';

type AddMealModalProps = {
  visible: boolean;
  date: string; // YYYY-MM-DD
  dateLabel: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddMealModal({
  visible,
  date,
  dateLabel,
  onClose,
  onAdded,
}: AddMealModalProps) {
  const { session } = useAuth();
  const { home } = useHome();
  const { textHigh, textMedium, textDisabled, primary, secondary, onPrimary } = useThemeColors();
  const { themeVars } = useTheme();
  const userId = session?.user?.id;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [isSaving, setIsSaving] = useState(false);

  // ── Two-step flow state ──
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [adjustedServings, setAdjustedServings] = useState(1);

  const loadRecipes = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoadingRecipes(true);
      // Load user's personal collection: self-created + bookmarked recipes
      const data = await getPersonalRecipes(userId);
      setRecipes(data);
    } catch (err) {
      // silently handle error
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      loadRecipes();
      // Reset two-step state when modal opens
      setSelectedRecipe(null);
      setAdjustedServings(1);
    }
  }, [visible, loadRecipes]);

  // ── Scaled calorie info ──
  const scaledCal = useMemo(() => {
    if (!selectedRecipe) return null;
    return scaleCalories(selectedRecipe.calories, selectedRecipe.servings, adjustedServings);
  }, [selectedRecipe, adjustedServings]);

  const perServing = useMemo(() => {
    if (!selectedRecipe) return null;
    return caloriesPerServing(selectedRecipe.calories, selectedRecipe.servings);
  }, [selectedRecipe]);

  // ── Handlers ──

  const handlePickRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setAdjustedServings(recipe.servings); // Start at recipe default
  };

  const handleBack = () => {
    setSelectedRecipe(null);
  };

  const handleConfirm = async () => {
    if (!selectedRecipe || !home?.id || !session?.user?.id) return;

    try {
      setIsSaving(true);
      await addMealPlan({
        home_id: home.id,
        recipe_id: selectedRecipe.id,
        date,
        meal_type: selectedMealType,
        servings: adjustedServings,
        created_by: session.user.id,
      });
      onAdded();
      onClose();
    } catch (err) {
      // silently handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedRecipe(null);
    onClose();
  };

  // ── Step 2: Adjust servings ──
  const renderServingStep = () => {
    if (!selectedRecipe) return null;

    return (
      <View className="flex-1">
        {/* Recipe summary card */}
        <View className="mx-5 mt-4 card">
          <View className="flex-row items-center">
            <RecipeImage
              recipeId={selectedRecipe.id}
              imageUrl={selectedRecipe.image_url}
              size="circle"
            />
            <View className="ml-3 flex-1">
              <Text className="text-text-high font-bold text-base" numberOfLines={2}>
                {selectedRecipe.title}
              </Text>
              {selectedRecipe.description ? (
                <Text className="text-text-medium text-xs mt-0.5" numberOfLines={1}>
                  {selectedRecipe.description}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Serving adjuster */}
        <View className="mx-5 mt-4 card">
          <Text className="text-text-medium text-xs font-medium mb-3 uppercase tracking-wider">
            How many servings?
          </Text>

          <View className="flex-row items-center justify-between">
            <ServingStepper
              value={adjustedServings}
              onChange={setAdjustedServings}
            />

            {/* Calorie info */}
            <View className="flex-row gap-2">
              {scaledCal != null && (
                <View className="flex-row items-center gap-1.5 bg-surface-2 px-3 py-2 rounded-full">
                  <Ionicons name="flame-outline" size={14} color={primary} />
                  <Text className="text-xs text-text-high font-medium">
                    {scaledCal} kcal
                  </Text>
                </View>
              )}

              {perServing != null && (
                <View className="flex-row items-center gap-1.5 bg-surface-2 px-3 py-2 rounded-full">
                  <Ionicons name="person-outline" size={14} color={secondary} />
                  <Text className="text-xs text-text-high font-medium">
                    {perServing}/srv
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Scaled indicator */}
          {adjustedServings !== selectedRecipe.servings && (
            <View className="flex-row items-center gap-1.5 mt-3">
              <Ionicons name="information-circle-outline" size={14} color={primary} />
              <Text className="text-xs text-primary">
                Adjusted from {selectedRecipe.servings} servings
              </Text>
            </View>
          )}
        </View>

        {/* Ingredient preview */}
        <View className="mx-5 mt-4 card">
          <Text className="text-text-medium text-xs font-medium mb-2 uppercase tracking-wider">
            Ingredients ({selectedRecipe.ingredients?.length ?? 0})
          </Text>
          {(selectedRecipe.ingredients ?? []).slice(0, 5).map((ing, idx) => (
            <View key={idx} className="flex-row items-center py-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
              <Text className="text-text-high text-sm flex-1" numberOfLines={1}>
                {ing.name}
              </Text>
              {ing.quantity ? (
                <Text className="text-text-medium text-xs">
                  {ing.quantity} {ing.unit}
                </Text>
              ) : null}
            </View>
          ))}
          {(selectedRecipe.ingredients?.length ?? 0) > 5 && (
            <Text className="text-text-disabled text-xs mt-1">
              +{selectedRecipe.ingredients!.length - 5} more
            </Text>
          )}
        </View>

        {/* Confirm button */}
        <View className="mx-5 mt-6">
          <Pressable
            onPress={handleConfirm}
            disabled={isSaving}
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={onPrimary} />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={onPrimary} />
                <Text className="text-on-primary font-bold text-base ml-2">
                  Add to {selectedMealType}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  // ── Step 1: Pick a recipe ──
  const renderRecipeList = () => (
    <View className="flex-1 px-5 pt-3">
      <Text className="section-heading mb-3">Choose a recipe</Text>

      {isLoadingRecipes ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : recipes.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="book-outline" size={48} color={textDisabled} />
          <Text className="text-text-medium mt-4">No recipes yet</Text>
          <Text className="text-xs text-text-disabled mt-1 text-center px-6">
            Create a recipe or bookmark public recipes first, then plan meals
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePickRecipe(item)}
              testID={`meal-modal-recipe-${item.id}`}
              className="card mb-2 flex-row items-center active:bg-surface-3"
            >
              <View className="mr-3">
                <RecipeImage
                  recipeId={item.id}
                  imageUrl={item.image_url}
                  size="circle"
                />
              </View>

              <View className="flex-1">
                <Text className="text-text-high font-semibold" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-text-medium text-xs mt-0.5" numberOfLines={1}>
                  {item.calories ? `${item.calories} cal` : ''}{item.calories && item.servings ? ' · ' : ''}{item.servings} servings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={textMedium} />
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[{ flex: 1 }, themeVars]} className="bg-background">
        {/* Header */}
        <View className="px-5 pt-6 pb-4 bg-surface-1 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {selectedRecipe && (
              <Pressable
                onPress={handleBack}
                className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3 mr-1"
                accessibilityLabel="Back to recipe list"
              >
                <Ionicons name="arrow-back" size={20} color={textHigh} />
              </Pressable>
            )}
            <View className="flex-1">
              <Text className="text-xl font-bold text-text-high">
                {selectedRecipe ? 'Adjust Servings' : 'Add Meal'}
              </Text>
              <Text className="text-sm text-text-medium mt-0.5">{dateLabel}</Text>
            </View>
          </View>
          <Pressable
            onPress={handleClose}
            testID="meal-modal-cancel"
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
          >
            <Ionicons name="close" size={24} color={textHigh} />
          </Pressable>
        </View>

        {/* Meal type tab bar (only on step 1) */}
        {!selectedRecipe && (
          <View className="px-5 pt-3 pb-1">
            <MealTypeTabBar
              selected={selectedMealType}
              onSelect={setSelectedMealType}
            />
          </View>
        )}

        {/* Content: Step 1 or Step 2 */}
        {selectedRecipe ? renderServingStep() : renderRecipeList()}
      </View>
    </Modal>
  );
}
