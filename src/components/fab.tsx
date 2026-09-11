// ─────────────────────────────────────────────────────────────
// components/fab.tsx
// ─────────────────────────────────────────────────────────────
import { Ionicons } from "@expo/vector-icons";
import React, { FC } from "react";
import { Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface FabProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
}

const Fab: FC<FabProps> = ({
  onPress,
  icon = "add",
  accessibilityLabel = "Create new",
}) => {
  const { theme } = useUnistyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={28} color={theme.colors.onPrimary} />
    </Pressable>
  );
};

export default Fab;

const styles = StyleSheet.create((theme) => ({
  fab: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.lg,
  },
  fabPressed: {
    opacity: theme.opacity.pressed,
    transform: [{ scale: 0.96 }],
  },
}));
