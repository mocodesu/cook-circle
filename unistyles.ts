import { getStoredValues, saveSecurely } from "@/store/storage";
import {
  APP_COLOR_SCHEMES,
  AppColorSchemeId,
  DEFAULT_SCHEME_ID,
} from "@/theme/color-schemes";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";

// ---------- Base spacing ----------
export const BASE_GAP = 5;

const COLOR_SCHEME_STORAGE_KEY = "app-color-scheme";

const resolveColorScheme = (schemeId: AppColorSchemeId = DEFAULT_SCHEME_ID) =>
  APP_COLOR_SCHEMES.find((scheme) => scheme.id === schemeId) ??
  APP_COLOR_SCHEMES.find((scheme) => scheme.id === DEFAULT_SCHEME_ID)!;

// ---------- Theme factory ----------
export const createLightColors = (
  schemeId: AppColorSchemeId = DEFAULT_SCHEME_ID,
) => resolveColorScheme(schemeId).tokens.light;

export const createDarkColors = (
  schemeId: AppColorSchemeId = DEFAULT_SCHEME_ID,
) => resolveColorScheme(schemeId).tokens.dark;

// ---------- Storage ----------
export const getStoredAppColorScheme = (): AppColorSchemeId => {
  try {
    const storedValues = getStoredValues([COLOR_SCHEME_STORAGE_KEY]);
    const schemeId = storedValues[COLOR_SCHEME_STORAGE_KEY];

    if (
      schemeId &&
      APP_COLOR_SCHEMES.some((scheme) => scheme.id === schemeId)
    ) {
      return schemeId as AppColorSchemeId;
    }
  } catch {}

  return DEFAULT_SCHEME_ID;
};

const initialScheme = getStoredAppColorScheme();

// Seed themes with stored colors
export const Colors = createLightColors(initialScheme);
export const DarkColors = createDarkColors(initialScheme);

// ---------- Runtime scheme switching ----------
export const applyAppColorScheme = (
  schemeId: AppColorSchemeId = DEFAULT_SCHEME_ID,
) => {
  const lightColors = createLightColors(schemeId);
  const darkColors = createDarkColors(schemeId);

  UnistylesRuntime.updateTheme("light", (theme) => ({
    ...theme,
    colors: lightColors,
  }));

  UnistylesRuntime.updateTheme("dark", (theme) => ({
    ...theme,
    colors: darkColors,
  }));

  UnistylesRuntime.setRootViewBackgroundColor(
    UnistylesRuntime.themeName === "light"
      ? lightColors.background
      : darkColors.background,
  );
};

// ---------- Persistence ----------
export const saveAppColorScheme = (schemeId: AppColorSchemeId) => {
  try {
    saveSecurely([{ key: COLOR_SCHEME_STORAGE_KEY, value: schemeId }]);
  } catch {}
};

export const initAppColorScheme = () => {
  const schemeId = getStoredAppColorScheme();
  applyAppColorScheme(schemeId);
  return schemeId;
};

export const selectAppColorScheme = (schemeId: AppColorSchemeId) => {
  applyAppColorScheme(schemeId);
  saveAppColorScheme(schemeId);
};

// ---------- Unistyles themes ----------
const lightTheme = {
  colors: Colors,
  gap: (v: number) => v * BASE_GAP,
  paddingHorizontal: BASE_GAP * 2,
  spacing: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
  radii: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
} as const;

const darkTheme = {
  colors: DarkColors,
  gap: (v: number) => v * BASE_GAP,
  paddingHorizontal: BASE_GAP * 2,
  spacing: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
  radii: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
} as const;

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

const breakpoints = {
  phone: 0,
  largePhone: 400,
  tablet: 768,
} as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  settings: {
    initialTheme: "dark",
    nativeBreakpointsMode: "pixels",
    CSSVars: true,
  },
  themes: appThemes,
  breakpoints,
});
