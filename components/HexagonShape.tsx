import { View, type ViewStyle } from 'react-native';

type HexagonShapeProps = {
  size: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  children: React.ReactNode;
};

/**
 * A flat-top regular hexagon built with rotated rectangles (no SVG needed).
 * Works on both React Native and web.
 */
export default function HexagonShape({
  size,
  backgroundColor = 'transparent',
  borderColor,
  borderWidth = 0,
  children,
}: HexagonShapeProps) {
  // A hexagon can be approximated by overlapping 3 rotated rectangles
  const height = size;
  const width = size * 0.866; // cos(30°) ≈ 0.866

  const baseRect: ViewStyle = {
    position: 'absolute',
    width,
    height: height * 0.5,
    backgroundColor,
    borderRadius: size * 0.1,
    ...(borderColor && borderWidth
      ? { borderWidth, borderColor }
      : {}),
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Three overlapping rotated rectangles form a hexagon */}
      <View
        style={{
          ...baseRect,
          transform: [{ rotate: '0deg' }],
        }}
      />
      <View
        style={{
          ...baseRect,
          transform: [{ rotate: '60deg' }],
        }}
      />
      <View
        style={{
          ...baseRect,
          transform: [{ rotate: '-60deg' }],
        }}
      />

      {/* Content on top */}
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          zIndex: 1,
        }}
      >
        {children}
      </View>
    </View>
  );
}
