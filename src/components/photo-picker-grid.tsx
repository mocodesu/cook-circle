// ─────────────────────────────────────────────────────────────
// components/photo-picker-grid.tsx
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import { Ionicons } from "@expo/vector-icons";
import React, { FC } from "react";
import { Image, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface PickedPhoto {
  id: string;
  uri: string;
}

interface PhotoPickerGridProps {
  photos: PickedPhoto[];
  max?: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

const PhotoPickerGrid: FC<PhotoPickerGridProps> = ({
  photos,
  max = 4,
  onAdd,
  onRemove,
}) => {
  const { theme } = useUnistyles();
  const canAddMore = photos.length < max;

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <View key={photo.id} style={styles.tile}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.image}
            resizeMode="cover"
          />
          <Pressable
            onPress={() => onRemove(photo.id)}
            style={styles.removeButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <Ionicons name="close" size={14} color={theme.colors.onPrimary} />
          </Pressable>
        </View>
      ))}

      {canAddMore && (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            styles.tile,
            styles.addTile,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add photo"
        >
          <Ionicons name="add" size={28} color={theme.colors.mutedText} />
          <Text variant="caption" color="mutedText">
            Add photo
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default PhotoPickerGrid;

const styles = StyleSheet.create((theme) => ({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  tile: {
    width: "48.5%",
    aspectRatio: 1,
    borderRadius: theme.radii.md,
    overflow: "hidden",
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  addTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
  removeButton: {
    position: "absolute",
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: 24,
    height: 24,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.sm,
  },
}));
