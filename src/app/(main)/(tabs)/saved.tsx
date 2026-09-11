// ─────────────────────────────────────────────────────────────
// app/(main)/(tabs)/saved.tsx
// ─────────────────────────────────────────────────────────────
import FoodItemCard from "@/components/food-item-card";
import SavedOverview from "@/components/saved-overview";
import Text from "@/components/text";
import { useSavedItems } from "@/hooks/use-saved";
import React from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function SavedScreen() {
  const { items } = useSavedItems();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <SavedOverview count={items.length} />

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const EmptyState: React.FC = () => (
  <View style={styles.empty}>
    <Text variant="display" color="mutedText">
      🍽
    </Text>
    <Text variant="h3" color="onBackground" textAlign="center">
      Nothing saved yet
    </Text>
    <Text
      variant="callout"
      color="mutedText"
      textAlign="center"
      style={styles.emptyBody}
    >
      Tap the bookmark on any recipe in your Kitchen to keep it here.
    </Text>
  </View>
);

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: rt.insets.top,
  },
  content: { paddingBottom: theme.spacing.xxl },
  list: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.giant,
  },
  emptyBody: { maxWidth: 280 },
}));
