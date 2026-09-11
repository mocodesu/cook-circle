// ─────────────────────────────────────────────────────────────
// components/save-button.tsx
// ─────────────────────────────────────────────────────────────
import { useIsSaved } from "@/hooks/use-saved";
import { SavedRepo } from "@/repositories/saved-repo";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import React, { FC } from "react";
import { Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface SaveButtonProps {
  recipeId: string;
  size?: number;
}

const SaveButton: FC<SaveButtonProps> = ({ recipeId, size = 36 }) => {
  const { theme } = useUnistyles();
  const db = useSQLiteContext();

  const isSaved = useIsSaved(recipeId);

  const handleToggle = async () => {
    await SavedRepo.toggle(db, recipeId);
    // SavedRepo.toggle emits DataEvents — no manual emit needed
  };

  return (
    <Pressable
      onPress={(e) => {
        // Guard against the parent Pressable/Link firing navigation
        e.stopPropagation?.();
        handleToggle();
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
