// ─────────────────────────────────────────────────────────────
// components/save-button.tsx
// ─────────────────────────────────────────────────────────────
import { useSavedRecipes } from "@/store/saved-recipes";
import { Ionicons } from "@expo/vector-icons";
import React, { FC } from "react";
import { Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface SaveButtonProps {
  recipeId: string;
  size?: number;
}

const SaveButton: FC<SaveButtonProps> = ({ recipeId, size = 36 }) => {
  const { theme } = useUnistyles();

  const isSaved = useSavedRecipes((s) => s.savedIds.includes(recipeId));
  const toggle = useSavedRecipes((s) => s.toggle);

  return (
    <Pressable
      onPress={(e) => {
        // Guard against the parent Pressable/Link firing navigation
        e.stopPropagation?.();
        toggle(recipeId);
      }}
      hitSlop={12}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? "Remove from saved" : "Save recipe"}
      accessibilityState={{ selected: isSaved }}
    >
      <Ionicons
        name={isSaved ? "bookmark" : "bookmark-outline"}
        size={size * 0.55}
        color={isSaved ? theme.colors.primary : theme.colors.onSurface}
      />
    </Pressable>
  );
};

export default SaveButton;

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.colors.panelBorder,
    ...theme.elevation.sm,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
}));
