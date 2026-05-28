/**
 * SVG-based Icon component — drop-in replacement for @expo/vector-icons Ionicons.
 *
 * History: Font-based icons (@expo/vector-icons) silently failed to register
 * in production AAB/IPA builds. After 6+ release attempts (1.3.0 → 1.3.6)
 * trying to fix font bundling (asset path, expo-font plugin, useFonts, Bridge
 * mode, etc), the only reliable solution is to bypass the font system entirely
 * and render icons as SVG components.
 *
 * Why this works where fonts didn't:
 *   - SVG icons are React components, not OS-level fonts
 *   - Rendered as <path> elements via react-native-svg at runtime
 *   - No native font registry, no asset bundling complexity, no platform quirks
 *   - Identical behavior on iOS, Android, web — guaranteed
 *
 * API matches Ionicons so call sites don't need to change much:
 *   <Icon name="home" size={24} color="#fff" />
 *
 * If a needed Ionicons name isn't mapped, this component logs a dev warning
 * and renders a fallback placeholder (a small dot). Add the mapping in
 * IONICONS_TO_LUCIDE below.
 */

import * as React from 'react';
import {
  // Each import is a tree-shakable SVG icon component from lucide-react-native.
  // These are direct React components — they render <Svg><Path /></Svg> at runtime.
  House,
  BookOpen,
  Book,
  Bookmark,
  ShoppingCart,
  Users,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  X,
  CircleX,
  CirclePlus,
  CircleAlert,
  Pencil,
  Trash2,
  Share2,
  Key,
  Flame,
  Info,
  TriangleAlert,
  CloudOff,
  LogOut,
  LogIn,
  Apple,
  UtensilsCrossed,
  ShieldCheck,
  Calendar,
  FileText,
  SquarePen,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * The complete mapping of Ionicons names actually used in the codebase
 * to their Lucide SVG equivalents. "*-outline" Ionicons map to the same
 * Lucide icon since Lucide icons are all stroke-style (outline-equivalent).
 * "filled" variants use a `fill` attribute we pass when rendering.
 */
const IONICONS_TO_LUCIDE: Record<string, LucideIcon> = {
  // Add / plus
  add: Plus,
  'add-circle': CirclePlus,
  'add-circle-outline': CirclePlus,

  // Alert / info / warning
  'alert-circle': CircleAlert,
  'alert-circle-outline': CircleAlert,
  'information-circle-outline': Info,
  'warning-outline': TriangleAlert,

  // Arrows + chevrons
  'arrow-back': ArrowLeft,
  'chevron-back': ChevronLeft,
  'chevron-forward': ChevronRight,

  // Bookmark (filled vs outline handled via fill prop at render time)
  bookmark: Bookmark,
  'bookmark-outline': Bookmark,

  // Book / cookbook
  book: Book,
  'book-outline': BookOpen,

  // Cart / shopping
  cart: ShoppingCart,
  'cart-outline': ShoppingCart,

  // Calendar
  calendar: Calendar,
  'calendar-outline': Calendar,

  // Checkmark / close / remove
  checkmark: Check,
  close: X,
  'close-circle': CircleX,
  'close-circle-outline': CircleX,
  remove: Minus,

  // Cloud / offline
  'cloud-offline-outline': CloudOff,

  // Edit
  'create-outline': SquarePen,
  pencil: Pencil,

  // File / document
  'document-text-outline': FileText,

  // Enter / exit / login
  'enter-outline': LogIn,
  'exit-outline': LogOut,
  'log-out-outline': LogOut,

  // Flame
  flame: Flame,
  'flame-outline': Flame,

  // Home
  home: House,
  'home-outline': House,

  // Key
  'key-outline': Key,

  // Nutrition / food
  'nutrition-outline': Apple,
  'restaurant-outline': UtensilsCrossed,

  // Brand logos (Apple Sign In etc.)
  'logo-apple': Apple,

  // Open in browser / external
  'open-outline': Share2,

  // People / person
  people: Users,
  'people-outline': Users,
  person: User,
  'person-outline': User,

  // Search
  search: Search,
  'search-outline': Search,

  // Share
  'share-outline': Share2,

  // Shield
  'shield-checkmark-outline': ShieldCheck,

  // Trash
  'trash-outline': Trash2,
};

/**
 * Names that represent FILLED variants — should be rendered with fill applied.
 * Lucide icons are all outline-style by default; pass fill={color} to fill them.
 *
 * BUG FIX: do NOT include circle-containing icons whose interior glyph is a
 * STROKE (Lucide CirclePlus, CircleX, CircleAlert). Filling the circle with
 * the same color hides the inner "+"/"x"/"!" stroke, leaving the user with
 * an unidentifiable solid disc. Keep only icons whose visual intent is a
 * truly solid shape (bookmark, flame).
 */
const FILLED_VARIANTS = new Set(['bookmark', 'flame']);

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  /** Stroke width override. Default 2 (lucide default). */
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  const LucideComponent = IONICONS_TO_LUCIDE[name];

  if (!LucideComponent) {
    if (__DEV__) {
      console.warn(`[Icon] No mapping for Ionicons name "${name}". Add it to IONICONS_TO_LUCIDE in components/Icon.tsx.`);
    }
    return null;
  }

  const fill = FILLED_VARIANTS.has(name) ? color : 'none';

  return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} fill={fill} />;
}

// Default export so call sites can use either:
//   import { Icon } from '@/components/Icon';
//   import Icon from '@/components/Icon';
export default Icon;
