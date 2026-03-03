import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { getRecipeVisual } from '@/lib/recipe-visuals';

type RecipeImageSize = 'hero' | 'thumb' | 'circle';

type RecipeImageProps = {
  recipeId: string;
  imageUrl?: string | null;
  size: RecipeImageSize;
};

const SIZE_CONFIG: Record<RecipeImageSize, {
  containerClass: string;
  emojiSize: string;
  width?: number;
  height?: number;
}> = {
  hero: {
    containerClass: 'h-52 rounded-3xl items-center justify-center overflow-hidden',
    emojiSize: 'text-7xl',
  },
  thumb: {
    containerClass: 'w-40 h-32 rounded-2xl items-center justify-center overflow-hidden',
    emojiSize: 'text-4xl',
    width: 160,
    height: 128,
  },
  circle: {
    containerClass: 'w-14 h-14 rounded-full items-center justify-center overflow-hidden',
    emojiSize: 'text-2xl',
    width: 56,
    height: 56,
  },
};

/**
 * Renders a recipe image with fallback to emoji/gradient.
 * If imageUrl is provided and loads, shows the real image.
 * Otherwise falls back to the deterministic emoji + colored background.
 */
export default function RecipeImage({ recipeId, imageUrl, size }: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!imageUrl);
  const visual = getRecipeVisual(recipeId);
  const config = SIZE_CONFIG[size];

  const showImage = imageUrl && !hasError;

  return (
    <View
      className={config.containerClass}
      style={{ backgroundColor: visual.backgroundColor }}
    >
      {showImage ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
          {isLoading && (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </>
      ) : (
        <Text className={config.emojiSize}>{visual.emoji}</Text>
      )}
    </View>
  );
}
