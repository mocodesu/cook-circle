// ─────────────────────────────────────────────────────────────
// components/food-item-card.tsx
// ─────────────────────────────────────────────────────────────
import SaveButton from "@/components/save-button";
import Text from "@/components/text";
import type { FoodItem } from "@/data/food-items";
import { Link } from "expo-router";
import React, { FC } from "react";
import { Image, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface FoodItemCardProps {
  item: FoodItem;
}

const FoodItemCard: FC<FoodItemCardProps> = ({ item }) => {
  return (
    <Link
      href={{ pathname: "/(main)/food-details", params: { id: item.id } }}
      asChild
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.description}`}
      >
        {/* Image with save overlay */}
        <View style={styles.imageWrapper}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text variant="h2" color="mutedText">
                🍽
              </Text>
            </View>
          )}

          <View style={styles.saveOverlay}>
            <SaveButton recipeId={item.id} />
          </View>
        </View>

        <View style={styles.body}>
          <Text variant="title" color="onSurface" maxLines={1}>
            {item.title}
          </Text>

          <Text variant="subhead" color="mutedText" maxLines={2}>
            {item.description}
          </Text>

          <Text
            variant="micro"
            color="primary"
            textTransform="uppercase"
            style={styles.source}
          >
            {item.source === "forked" ? "Forked" : "Created by you"}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
};

export default FoodItemCard;

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: theme.opacity.pressed,
  },

  imageWrapper: {
    position: "relative",
    width: "100%",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.panel,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  saveOverlay: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },

  body: {
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  source: {
    marginTop: theme.spacing.xxs,
  },
}));
