import React, { FC } from "react";
import { Platform, Text as RNText, TextProps, TextStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * ============================================================================
 * TYPOGRAPHY COMPONENT — reusable template
 * ============================================================================
 * A single, highly configurable text component that replaces all ad‑hoc
 * `<Text>` usage across your mobile app. Drop this file in, customise the
 * sections below, and use `<Text variant="h1">...</Text>` everywhere.
 *
 * WHAT TO CUSTOMIZE (search for "CUSTOMIZE"):
 *   1. FONT_SIZES              – per‑variant font sizes for iOS and Android
 *   2. LINE_HEIGHT_MULTIPLIERS – how line height scales per variant category
 *   3. FONT_FAMILIES           – your actual font family strings (leave empty
 *                                if you want the system font)
 *   4. COLOR_VARIANTS          – import your theme colour token types
 *
 * HOW TO WIRE IT UP:
 *   - If you use custom fonts, fill in the `FONT_FAMILIES` object with the
 *     PostScript names of your font files. To use the **system font**,
 *     simply leave the entries as `undefined` (the default) – the component
 *     will then use `fontWeight` instead of `fontFamily` for bold/medium
 *     etc., and regular text will inherit the OS default typeface.
 *   - The `color` prop autocompletes every colour token defined in your
 *     Unistyles theme. You can also pass `"white"`, `"black"`, `"muted"` or
 *     `"disabled"` for static, one‑off values.
 *   - Optionally alias this component so that `import { Text } from
 *     '@/components/Text'` replaces the default React Native Text.
 *
 * WHY YOU'LL LOVE IT:
 *   - Consistent typography across platforms with a single source of truth.
 *   - Quick, prop‑based overrides (bold, color, opacity …) without style
 *     leakage or inline magic numbers.
 *   - Automatically picks the right font size per platform and adjusts line
 *     height proportionally — everything stays visually balanced.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

/** Pre‑defined typographic scales. Add / remove as you see fit. */
type Variant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body1"
  | "body2"
  | "button"
  | "caption"
  | "overline";

/**
 * All colour tokens available in your Unistyles theme.
 *
 * CUSTOMIZE #4 — replace this union with a type that reflects your actual
 * theme colours. For example:
 *
 *   import type { AppTheme } from '@/theme';
 *   type ThemeColorKey = keyof AppTheme['colors'];
 *
 * The list below matches the `APP_COLOR_SCHEMES` you provided.
 */
type ThemeColorKey =
  | "primary"
  | "primaryIllumination"
  | "secondary"
  | "onPrimary"
  | "onSecondary"
  | "tertiary"
  | "background"
  | "onBackground"
  | "surface"
  | "onSurface"
  | "panel"
  | "panelBorder"
  | "mutedText"
  | "active"
  | "activeSurface"
  | "activeField"
  | "inactive"
  | "inactiveSurface"
  | "danger"
  | "dangerIllumination"
  | "darkKey"
  | "darkKeyIllumination";

/** Static colour helpers that don’t come from the theme. */
type StaticColor = "white" | "black" | "muted" | "disabled";

/** Any colour you can pass to the `color` prop. */
type ColorVariant = ThemeColorKey | StaticColor;

interface CustomTextProps extends TextProps {
  /** Typographic variant – determines size, line height, and default weight. */
  variant?: Variant;
  /** Override the font family directly (e.g. 'Inter-Bold'). */
  fontFamily?: string;
  /** Quick weight switches – these work with system fonts too. */
  bold?: boolean;
  semibold?: boolean;
  medium?: boolean;
  light?: boolean;
  /** Exact font size in points. Overrides variant. */
  fontSize?: number;
  /** Exact line height. Overrides variant‑based calculation. */
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  /** Any theme colour token, or 'white'/'black'/'muted'/'disabled'. */
  color?: ColorVariant;
  opacity?: number;
  underline?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
  truncate?: boolean;
  maxLines?: number;
}

// ---------------------------------------------------------------------------
// CUSTOMIZE #1 — FONT SIZES
// Define the exact point size for each variant on iOS and Android.
// Entries are required for every variant listed in the `Variant` type.
// ---------------------------------------------------------------------------
const FONT_SIZES: Record<Variant, { ios: number; android: number }> = {
  display: { ios: 30, android: 32 },
  h1: { ios: 22, android: 24 },
  h2: { ios: 20, android: 22 },
  h3: { ios: 18, android: 20 },
  h4: { ios: 16, android: 18 },
  body1: { ios: 14, android: 16 },
  body2: { ios: 12, android: 14 },
  button: { ios: 12, android: 14 },
  caption: { ios: 10, android: 12 },
  overline: { ios: 9, android: 10 },
};

// ---------------------------------------------------------------------------
// CUSTOMIZE #2 — LINE HEIGHT MULTIPLIERS
// Multipliers are applied to the final font size.  Categories group
// variants that should share the same reading comfort.
// ---------------------------------------------------------------------------
const LINE_HEIGHT_CATEGORIES: Record<string, Variant[]> = {
  heading: ["display", "h1", "h2"],
  subheading: ["h3", "h4"],
  body: ["body1", "body2"],
  ui: ["button", "caption", "overline"],
};

const LINE_HEIGHT_MULTIPLIERS: Record<string, number> = {
  heading: 1.2,
  subheading: 1.3,
  body: 1.5,
  ui: 1.3,
};

// ---------------------------------------------------------------------------
// CUSTOMIZE #3 — FONT FAMILIES
// Replace these with the PostScript names of your custom fonts.
// To use the **system font** for a given weight, leave the value as
// `undefined` – the component will then apply the corresponding
// `fontWeight` style instead (e.g. 'bold' → fontWeight 'bold').
// If all entries are `undefined`, the entire component falls back to the
// platform's default typeface.
// ---------------------------------------------------------------------------
const FONT_FAMILIES: Record<string, string | undefined> = {
  regular: undefined, // e.g. 'Inter-Regular'
  medium: undefined, // e.g. 'Inter-Medium'
  semibold: undefined, // e.g. 'Inter-SemiBold'
  bold: undefined, // e.g. 'Inter-Bold'
  light: undefined, // e.g. 'Inter-Light'
};

// Map weight names to CSS font-weight values when system fonts are used
const SYSTEM_FONT_WEIGHT_MAP: Record<string, TextStyle["fontWeight"]> = {
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

// ---------------------------------------------------------------------------
// CUSTOMIZE #4 — DEFAULT COLOUR
// Which theme colour to use when no `color` prop is provided.
// ---------------------------------------------------------------------------
const DEFAULT_COLOR: ColorVariant = "onBackground";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick the platform font size for a given variant. */
const getFontSize = (variant: Variant, override?: number): number => {
  if (override !== undefined) return override;
  const sizes = FONT_SIZES[variant];
  return Platform.OS === "ios" ? sizes.ios : sizes.android;
};

/** Compute line height based on variant and font size. */
const getLineHeight = (
  variant: Variant,
  fontSize: number,
  override?: number,
): number => {
  if (override !== undefined) return override;
  const categoryEntry = Object.entries(LINE_HEIGHT_CATEGORIES).find(
    ([_, variants]) => variants.includes(variant),
  );
  const multiplier = categoryEntry
    ? LINE_HEIGHT_MULTIPLIERS[categoryEntry[0]]
    : 1.4;
  return fontSize * multiplier;
};

/**
 * Resolve the final font family and, if using system fonts, the
 * corresponding `fontWeight` value.
 *
 * Returns an object with optional `fontFamily` and `fontWeight` that
 * should be spread into the text style.
 */
const resolveFont = (
  explicitFamily?: string,
  bold?: boolean,
  semibold?: boolean,
  medium?: boolean,
  light?: boolean,
): { fontFamily?: string; fontWeight?: TextStyle["fontWeight"] } => {
  // 1. Explicit fontFamily wins
  if (explicitFamily) return { fontFamily: explicitFamily };

  // 2. Determine which weight the user requested
  let weightKey: string = "regular";
  if (bold) weightKey = "bold";
  else if (semibold) weightKey = "semibold";
  else if (medium) weightKey = "medium";
  else if (light) weightKey = "light";

  // 3. If a custom font family is defined for that weight, use it
  const customFamily = FONT_FAMILIES[weightKey];
  if (customFamily) return { fontFamily: customFamily };

  // 4. Otherwise, rely on the system font and return the equivalent fontWeight
  const systemWeight = SYSTEM_FONT_WEIGHT_MAP[weightKey] ?? "400";
  return { fontWeight: systemWeight };
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

const Text: FC<CustomTextProps> = ({
  variant = "body1",
  fontFamily,
  bold,
  semibold,
  medium,
  light,
  fontSize,
  lineHeight,
  letterSpacing,
  textAlign = "left",
  textTransform = "none",
  color = DEFAULT_COLOR,
  opacity = 1,
  underline,
  strikethrough,
  italic,
  truncate,
  maxLines,
  style,
  children,
  ...props
}) => {
  // Theme‑based styles (created inside component to have access to theme)
  const styles = StyleSheet.create((theme) => ({
    base: {
      // Empty container — we'll apply colour conditionally
    },
    // Dynamic theme colour lookup
    themeColor: (key: string) => ({
      color: theme.colors[key] ?? theme.colors.onBackground,
    }),
  }));

  // Resolve font size and line height
  const computedFontSize = getFontSize(variant, fontSize);
  const computedLineHeight = getLineHeight(
    variant,
    computedFontSize,
    lineHeight,
  );

  // Resolve font family / weight
  const { fontFamily: resolvedFamily, fontWeight: resolvedWeight } =
    resolveFont(fontFamily, bold, semibold, medium, light);

  // Build text decoration
  let textDecorationLine: TextStyle["textDecorationLine"] = "none";
  if (underline && strikethrough) textDecorationLine = "underline line-through";
  else if (underline) textDecorationLine = "underline";
  else if (strikethrough) textDecorationLine = "line-through";

  // Build colour style (static overrides first, then theme lookup)
  const colourStyle = (() => {
    if (color === "white") return { color: "#FFFFFF" };
    if (color === "black") return { color: "#000000" };
    if (color === "muted") return { opacity: 0.6 };
    if (color === "disabled") return { opacity: 0.4 };
    // Assume it's a valid theme token
    return styles.themeColor(color);
  })();

  // Assemble the final text style object
  const textStyle: TextStyle = {
    fontSize: computedFontSize,
    lineHeight: computedLineHeight,
    textAlign,
    textTransform,
    opacity,
    fontStyle: italic ? "italic" : "normal",
    textDecorationLine,
    ...(letterSpacing !== undefined && { letterSpacing }),
    // Apply font family / weight conditionally
    ...(resolvedFamily && { fontFamily: resolvedFamily }),
    ...(resolvedWeight && { fontWeight: resolvedWeight }),
  };

  // Pass‑through props for truncation
  const passThroughProps = {
    ...props,
    ...(truncate && { numberOfLines: 1, ellipsizeMode: "tail" as const }),
    ...(maxLines !== undefined && { numberOfLines: maxLines }),
  };

  return (
    <RNText
      style={[styles.base, colourStyle, textStyle, style]}
      {...passThroughProps}
    >
      {children}
    </RNText>
  );
};

export default Text;

// Re‑export types so consumers can import them easily
export type { ColorVariant, CustomTextProps, Variant };
