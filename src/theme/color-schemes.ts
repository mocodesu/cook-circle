// ---------- Single colour scheme definition ----------
export const APP_COLOR_SCHEMES = [
  /* ═══════════════════════════════════════════════════════════
     1. SAFFRON — RECOMMENDED
     Deep amber primary. Warm parchment background. Herb-green
     secondary. Signals "cooked, artisanal, premium" — the anti-
     Tasty. Best fit for a memory/local-first brand.
     ═══════════════════════════════════════════════════════════ */
  {
    id: "saffron",
    label: "Saffron",
    tokens: {
      light: {
        primary: "#B45309", // was #D97706  → 5.02:1 vs white
        primaryIllumination: "#D97706", // was #F59E0B
        inactive: "#B45309", // was #EA580C  → 4.68:1
        inactiveSurface: "rgba(180, 83, 9, 0.15)", // was rgba(234, 88, 12, 0.12)
        secondary: "#166534",

        onPrimary: "#FFFFFF",
        onSecondary: "#FFFFFF",

        tertiary: "#7C3AED",

        background: "#FFFBF5",
        onBackground: "#1C1917",

        surface: "#FFFFFF",
        onSurface: "#1C1917",

        panel: "rgba(120, 53, 15, 0.05)",
        panelBorder: "rgba(120, 53, 15, 0.10)",

        mutedText: "#78716C",

        active: "#16A34A",
        activeSurface: "rgba(22, 163, 74, 0.12)",
        activeField: "rgba(22, 163, 74, 0.20)",

        danger: "#DC2626",
        dangerIllumination: "rgba(220, 38, 38, 0.25)",

        darkKey: "rgba(28, 25, 23, 0.05)",
        darkKeyIllumination: "rgba(28, 25, 23, 0.09)",
      },
      dark: {
        primary: "#F59E0B",
        primaryIllumination: "#FBBF24",
        secondary: "#4ADE80",

        onPrimary: "#1C1917",
        onSecondary: "#052E16",

        tertiary: "#A78BFA",

        background: "#0C0A09",
        onBackground: "#FAFAF9",

        surface: "#1C1917",
        onSurface: "#FAFAF9",

        panel: "rgba(250, 250, 249, 0.04)",
        panelBorder: "rgba(250, 250, 249, 0.08)",

        mutedText: "#A8A29E",

        active: "#4ADE80",
        activeSurface: "rgba(74, 222, 128, 0.15)",
        activeField: "rgba(74, 222, 128, 0.25)",

        inactive: "#FB923C",
        inactiveSurface: "rgba(251, 146, 60, 0.15)",

        danger: "#F87171",
        dangerIllumination: "rgba(248, 113, 113, 0.25)",

        darkKey: "#292524",
        darkKeyIllumination: "#44403C",
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════
     2. POMEGRANATE — bold, appetizing, editorial
     Deep rose-red. For a confident, food-porn-forward brand.
     Secondary is deep teal — an unexpected, premium pairing.
     ═══════════════════════════════════════════════════════════ */
  {
    id: "pomegranate",
    label: "Pomegranate",
    tokens: {
      light: {
        primary: "#BE123C",
        primaryIllumination: "#E11D48",
        secondary: "#0F766E",

        onPrimary: "#FFFFFF",
        onSecondary: "#FFFFFF",

        tertiary: "#7C3AED",

        background: "#FFFBFA",
        onBackground: "#1C1917",

        surface: "#FFFFFF",
        onSurface: "#1C1917",

        panel: "rgba(190, 18, 60, 0.04)",
        panelBorder: "rgba(190, 18, 60, 0.10)",

        mutedText: "#78716C",

        active: "#059669",
        activeSurface: "rgba(5, 150, 105, 0.12)",
        activeField: "rgba(5, 150, 105, 0.20)",

        inactive: "#B45309", // was #D97706  → 4.72:1
        inactiveSurface: "rgba(180, 83, 9, 0.15)",

        danger: "#DC2626",
        dangerIllumination: "rgba(220, 38, 38, 0.25)",

        darkKey: "rgba(28, 25, 23, 0.05)",
        darkKeyIllumination: "rgba(28, 25, 23, 0.09)",
      },
      dark: {
        primary: "#FB7185",
        primaryIllumination: "#FDA4AF",
        secondary: "#2DD4BF",

        onPrimary: "#4C0519",
        onSecondary: "#042F2E",

        tertiary: "#A78BFA",

        background: "#0C0A0B",
        onBackground: "#FAFAF9",

        surface: "#1C1917",
        onSurface: "#FAFAF9",

        panel: "rgba(250, 250, 249, 0.04)",
        panelBorder: "rgba(250, 250, 249, 0.08)",

        mutedText: "#A8A29E",

        active: "#34D399",
        activeSurface: "rgba(52, 211, 153, 0.15)",
        activeField: "rgba(52, 211, 153, 0.25)",

        inactive: "#FBBF24",
        inactiveSurface: "rgba(251, 191, 36, 0.15)",

        danger: "#F87171",
        dangerIllumination: "rgba(248, 113, 113, 0.25)",

        darkKey: "#292524",
        darkKeyIllumination: "#44403C",
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════
     3. TERRACOTTA — earthy, handmade, artisan
     Burnt sienna. Feels like a clay pot, a handwritten recipe
     card, a warm kitchen. Most "premium craft" of the four.
     ═══════════════════════════════════════════════════════════ */
  {
    id: "terracotta",
    label: "Terracotta",
    tokens: {
      light: {
        primary: "#C2410C",
        primaryIllumination: "#EA580C",
        secondary: "#0E7490",

        onPrimary: "#FFFFFF",
        onSecondary: "#FFFFFF",

        tertiary: "#7C3AED",

        background: "#FFFBF7",
        onBackground: "#1C1410",

        surface: "#FFFFFF",
        onSurface: "#1C1410",

        panel: "rgba(194, 65, 12, 0.05)",
        panelBorder: "rgba(194, 65, 12, 0.10)",

        mutedText: "#78716C",

        active: "#16A34A",
        activeSurface: "rgba(22, 163, 74, 0.12)",
        activeField: "rgba(22, 163, 74, 0.20)",

        inactive: "#A16207", // was #CA8A04  → 4.72:1
        inactiveSurface: "rgba(161, 98, 7, 0.15)",

        danger: "#DC2626",
        dangerIllumination: "rgba(220, 38, 38, 0.25)",

        darkKey: "rgba(28, 20, 16, 0.05)",
        darkKeyIllumination: "rgba(28, 20, 16, 0.09)",
      },
      dark: {
        primary: "#FB923C",
        primaryIllumination: "#FDBA74",
        secondary: "#22D3EE",

        onPrimary: "#431407",
        onSecondary: "#083344",

        tertiary: "#A78BFA",

        background: "#0C0907",
        onBackground: "#FAF5F0",

        surface: "#1C1410",
        onSurface: "#FAF5F0",

        panel: "rgba(250, 245, 240, 0.04)",
        panelBorder: "rgba(250, 245, 240, 0.08)",

        mutedText: "#A8998E",

        active: "#4ADE80",
        activeSurface: "rgba(74, 222, 128, 0.15)",
        activeField: "rgba(74, 222, 128, 0.25)",

        inactive: "#FBBF24",
        inactiveSurface: "rgba(251, 191, 36, 0.15)",

        danger: "#F87171",
        dangerIllumination: "rgba(248, 113, 113, 0.25)",

        darkKey: "#292018",
        darkKeyIllumination: "#3D2F24",
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════
     4. MATCHA — fresh, healthy, calm
     Deep herb green. For a wellness/meal-prep angle. Saffron
     secondary keeps it appetizing rather than clinical.
     ═══════════════════════════════════════════════════════════ */
  {
    id: "matcha",
    label: "Matcha",
    tokens: {
      light: {
        primary: "#15803D",
        primaryIllumination: "#22C55E",
        secondary: "#D97706",

        onPrimary: "#FFFFFF",
        onSecondary: "#FFFFFF",

        tertiary: "#7C3AED",

        background: "#FAFCF9",
        onBackground: "#14261B",

        surface: "#FFFFFF",
        onSurface: "#14261B",

        panel: "rgba(21, 128, 61, 0.05)",
        panelBorder: "rgba(21, 128, 61, 0.10)",

        mutedText: "#65756A",

        active: "#16A34A",
        activeSurface: "rgba(22, 163, 74, 0.12)",
        activeField: "rgba(22, 163, 74, 0.20)",

        inactive: "#A16207", // was #CA8A04  → 4.74:1
        inactiveSurface: "rgba(161, 98, 7, 0.15)",

        danger: "#DC2626",
        dangerIllumination: "rgba(220, 38, 38, 0.25)",

        darkKey: "rgba(20, 38, 27, 0.05)",
        darkKeyIllumination: "rgba(20, 38, 27, 0.09)",
      },
      dark: {
        primary: "#4ADE80",
        primaryIllumination: "#86EFAC",
        secondary: "#FBBF24",

        onPrimary: "#052E16",
        onSecondary: "#451A03",

        tertiary: "#A78BFA",

        background: "#0A0F0C",
        onBackground: "#F0FDF4",

        surface: "#14261B",
        onSurface: "#F0FDF4",

        panel: "rgba(240, 253, 244, 0.04)",
        panelBorder: "rgba(240, 253, 244, 0.08)",

        mutedText: "#86A08E",

        active: "#4ADE80",
        activeSurface: "rgba(74, 222, 128, 0.15)",
        activeField: "rgba(74, 222, 128, 0.25)",

        inactive: "#FBBF24",
        inactiveSurface: "rgba(251, 191, 36, 0.15)",

        danger: "#F87171",
        dangerIllumination: "rgba(248, 113, 113, 0.25)",

        darkKey: "#1F382A",
        darkKeyIllumination: "#2F4D3C",
      },
    },
  },
] as const;

export type AppColorScheme = (typeof APP_COLOR_SCHEMES)[number];
export type AppColorSchemeId = AppColorScheme["id"];

export const DEFAULT_SCHEME_ID: AppColorSchemeId = APP_COLOR_SCHEMES[0].id;

export const DEFAULT_APP_COLOR_SCHEME = APP_COLOR_SCHEMES[0];

export const DEFAULT_LIGHT_COLORS = DEFAULT_APP_COLOR_SCHEME.tokens.light;

export const DEFAULT_DARK_COLORS = DEFAULT_APP_COLOR_SCHEME.tokens.dark;

export const DEFAULT_PRIMARY_COLOR = DEFAULT_LIGHT_COLORS.primary;

export const DEFAULT_DARK_PRIMARY_COLOR = DEFAULT_DARK_COLORS.primary;

export const DEFAULT_DARK_BACKGROUND_COLOR = DEFAULT_DARK_COLORS.background;

export const DEFAULT_LIGHT_BACKGROUND_COLOR = DEFAULT_LIGHT_COLORS.background;
